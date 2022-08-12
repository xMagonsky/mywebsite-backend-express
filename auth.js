const express = require("express")
const sessionRouter = express.Router()
const authRouter = express.Router()

const cookie = require("cookie")
const crypto = require("crypto")
const session = require("express-session")
let RedisStore = require("connect-redis")(session)
const {mysql, redisClient} = require("./database")


sessionRouter.use(session({
    store: new RedisStore({ client: redisClient }),
    name: "AUTH_SID",
    secret: process.env.SESSION_SECRET_KEY,
    resave: "false",
    saveUninitialized: "false"
}))


authRouter.use(sessionRouter)

// AUTHENTICATION
authRouter.use((req, res, next) => {
    if (req.session.userID && req.session.deviceID) {
        redisClient.get("device:" + req.session.deviceID, (err, found) => {
            if (err) {
                console.log(err)
                res.status(500).json({err: "DB_REDIS"})
                return
            }

            if (found) {
                next()

            } else {
                console.log("session destroyed - device not found", `userid: ${req.session.userID} deviceid: ${req.session.deviceID}`)
                req.session.destroy()
                res.status(401).json({err: "BAD_RM_TOKEN"})
            }
        })

    } else {
        // try to auth with remember me cookie
        const rememberMe = cookie.parse(req.headers.cookie || "").AUTH_RM
        if (!rememberMe) {
            res.status(401).json({err: "NO_RM_TOKEN"})
            return
        }
        const [deviceID, secretToken] = rememberMe.split(".")
        mysql.execute("SELECT devices.id, devices.owner, devices.rm_token, users.admin FROM devices, users WHERE devices.owner = users.id AND devices.id = ?", [deviceID], (err, result) => {
            if (err) {
                console.log(err)
                res.status(500).json({err: "DB_MYSQL"})
                return
            }

            if (result.length < 1) {
                res.status(401).json({err: "BAD_RM_TOKEN"})
                return
            }

            const hashedTokenBuffer = Buffer.from(crypto.createHash("sha256").update(secretToken).digest("base64url"), "base64url")
            const databaseTokenBuffer = Buffer.from(result[0].rm_token, "base64url")
            if (!crypto.timingSafeEqual(hashedTokenBuffer, databaseTokenBuffer)) {
                res.status(401).json({err: "BAD_RM_TOKEN"})
                return
            }
            // everything ok
            req.session.userID = result[0].owner
            req.session.deviceID = deviceID

            req.session.admin = (result[0].admin === 1) ? true : false 
            
            next()
        })
    }
})

function isAdmin (req, res, next) {
    if (req.session.admin === true) {
        next()
    }
    else {
        res.status(401).json({err: "NO_ADMIN"})
        return
    }
}

module.exports = sessionRouter
module.exports.auth = authRouter
module.exports.admin = isAdmin
