const express = require("express")
const router = express.Router()
const session = require("../auth")
const money = require("./money")
const bcrypt = require("bcrypt")
const crypto = require("crypto")
const {mysql, redisClient} = require("../database")


router.use("/money", money)

router.get("/", (req, res) => {
    res.json({msg: "API v0.1"})
})

router.get("/amilogged", session.auth, (req, res) => {
    res.json({
        admin: req.session.admin
    })
})

router.post("/login", session, (req, res) => {
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

        //TEST CREDENTIALS
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

                    if (req.body.rememberMe) res.cookie("AUTH_RM", deviceID + "." + secretToken)
                    req.session.userID = result[0].id
                    req.session.deviceID = deviceID
                    
                    req.session.admin = (result[0].admin === 1) ? true : false 
                    
                    res.json({status: "ok"})
                })
            })
        })
    })
})

router.post("/hashpw", (req, res) => {
    bcrypt.hash(req.body.password, 10, (err, hash) => {
        res.json({msg: hash})
    })
})

module.exports = router
