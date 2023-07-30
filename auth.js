const cookie = require("cookie")
const crypto = require("crypto")
const bcrypt = require("bcrypt")
const session = require("express-session")
let RedisStore = require("connect-redis")(session)
const {mysql, redisClient} = require("./database")


const useSession = session({
    store: new RedisStore({ client: redisClient }),
    name: "AUTH_SID",
    secret: process.env.SESSION_SECRET_KEY,
    resave: "false",
    saveUninitialized: "false"
})


function login(req, res) {
    useSession(req, res, () => {
        if (typeof(req.body.login) !== "string" || typeof(req.body.password) !== "string" || typeof(req.body.rememberMe) !== "boolean") {
            res.status(400).json({err: "BAD_BODY"})
            return
        }
    
        if (req.session.userID) {
            res.status(400).json({err: "ALREADY_LOGGED_IN"})
            return
        }
        
        mysql.execute("SELECT id, name, password, admin FROM users WHERE name = ?", [req.body.login], (err, result) => {
            if (err) {
                console.log(err)
                res.status(500).json({err: "DB_MYSQL"})
                return
            }
    
            //CHECK CREDENTIALS
            bcrypt.compare(req.body.password, result[0]?.password, (err, compare) => {
                if (compare !== true || result.length !== 1) {
                    res.status(401).json({err: "BAD_CREDENTIALS"})
                    return
                }
    
                const deviceID = crypto.randomBytes(16).toString("base64url")
                let secretToken;
                let hashedToken = null;
                if (req.body.rememberMe) {
                    secretToken = crypto.randomBytes(32).toString("base64url")
                    hashedToken = crypto.createHash("sha256").update(secretToken).digest("base64url")
                }
                mysql.execute("INSERT INTO devices (id, owner, rm_token) VALUES (?, ?, ?)", [deviceID, result[0].id, hashedToken], (err) => {
                    if (err) {
                        console.log(err)
                        res.status(500).json({err: "DB_MYSQL"})
                        return
                    }
                    
                    redisClient.set("device:" + deviceID, 1, (err) => {
                        if (err) {
                            console.log(err)
                            res.status(500).json({err: "DB_REDIS"})
                            return
                        }
    
                        if (req.body.rememberMe) res.cookie("AUTH_RM", deviceID + "." + secretToken, {httpOnly: true, maxAge: 31556952000})
                        req.session.userID = result[0].id
                        req.session.deviceID = deviceID
                        
                        req.session.admin = (result[0].admin === 1) ? true : false 
                        
                        res.json({status: "ok"})
                    })
                })
            })
        })
    })
}


function auth(req, res, next) {
    useSession(req, res, () => {
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
}

function isAdmin(req, res, next) {
    if (req.session.admin === true) {
        next()
        
    } else {
        res.status(401).json({err: "NO_ADMIN"})
        return
    }
}

module.exports = auth
module.exports.requireAdmin = isAdmin

module.exports.login = login
