const express = require("express")
const router = express.Router()
const {mysql} = require("../../database")
const session = require("../../auth")

router.get("/", (req, res) => {
    res.json({msg: "hello from money api"})
})

router.post("/", (req, res) => {
    if (isNaN(req.body.amount) || !Number.isInteger(req.body.creditorID) || !Number.isInteger(req.body.borrowerID)) {
        res.status(400).json({err: "BAD_BODY"})
        return
    }
    
    mysql.execute("INSERT INTO money (amount, id_creditor, id_borrower) VALUES (?, ?, ?);", [req.body.amount, req.body.creditorID, req.body.borrowerID],
    (err) => {
        if (err) {
            console.error(err)
            res.status(500).json({err: "DB_MYSQL"})
            return
        }
        res.json({status: "ok"})
    })
})

router.get("/loans", session.auth, (req, res) => {
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

router.get("/:id", session.auth, (req, res) => {
    mysql.execute("SELECT * FROM money WHERE id = ?;", [req.params.id],
    (err, result) => {
        if (err) {
            console.error(err)
            res.status(500).json({err: "DB_MYSQL"})
            return
        }
        res.status(200).json(result)
    })
})

router.patch("/:id", (req, res) => {
    if (isNaN(req.body.amount)) {
        res.status(400).json({err: "BAD_BODY"})
        return
    }

    mysql.execute("UPDATE money SET amount = ? WHERE id = ?;", [req.body.amount, req.params.id],
    (err) => {
        if (err) {
            console.error(err)
            res.status(500).json({err: "DB_MYSQL"})
            return
        }
        res.json({status: "ok"})
    })
})


module.exports = router
