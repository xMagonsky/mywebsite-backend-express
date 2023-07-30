const express = require("express")
const router = express.Router()
const auth = require("../auth")
const money = require("./money")


router.get("/", (req, res) => {
    res.json({msg: "API v0.1"})
})

router.get("/amilogged", auth, (req, res) => {
    res.json({
        admin: req.session.admin
    })
})

router.use("/login", auth.login)

router.use("/money", money)

// router.post("/hashpw", (req, res) => {
//     bcrypt.hash(req.body.password, 10, (err, hash) => {
//         res.json({msg: hash})
//     })
// })

module.exports = router
