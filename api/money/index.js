const express = require("express")
const router = express.Router()
const {mysql} = require("../../database")
const auth = require("../../auth")

const moneyAdmin = require("./admin")


router.use(auth)

router.get("/myloans", (req, res) => {
    mysql.execute("SELECT id, name, amount, created FROM money WHERE id_borrower = ? ORDER BY created;", [req.session.userID],
    (err, result) => {
        if (err) {
            console.error(err)
            res.status(500).json({err: "DB_MYSQL"})
            return
        }
        res.json(result)
    })
})

router.use(moneyAdmin)


module.exports = router
