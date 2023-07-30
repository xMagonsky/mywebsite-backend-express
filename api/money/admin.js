const express = require("express")
const router = express.Router()
const {mysql} = require("../../database")
const auth = require("../../auth")


router.use(auth.requireAdmin)

//get all loans
router.get("/", (req, res) => {
    mysql.execute("SELECT * FROM money;",
    (err, result) => {
        if (err) {
            console.error(err)
            res.status(500).json({err: "DB_MYSQL"})
            return
        }
        res.status(200).json(result)
    })
})

//create new loan
router.post("/", (req, res) => {
    if (isNaN(req.body.amount) || !Number.isInteger(req.body.creditorID) || !Number.isInteger(req.body.borrowerID) || typeof(req.body.name) !== "string") {
        res.status(400).json({err: "BAD_BODY"})
        return
    }
    
    mysql.execute("INSERT INTO money (name, amount, id_creditor, id_borrower) VALUES (?, ?, ?, ?);", [req.body.name, req.body.amount, req.body.creditorID, req.body.borrowerID],
    (err) => {
        if (err) {
            console.error(err)
            res.status(500).json({err: "DB_MYSQL"})
            return
        }
        res.json({status: "ok"})
    })
})

//get loan by id
router.get("/:id", (req, res) => {
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

//patch loan by id
router.patch("/:id", (req, res) => {
    if (isNaN(req.body.amount) || typeof(req.body.name) !== "string") {
        res.status(400).json({err: "BAD_BODY"})
        return
    }

    mysql.execute("UPDATE money SET name = ?, amount = ? WHERE id = ?;", [req.body.name, req.body.amount, req.params.id],
    (err) => {
        if (err) {
            console.error(err)
            res.status(500).json({err: "DB_MYSQL"})
            return
        }
        res.json({status: "ok"})
    })
})

//delete loan by id
router.delete("/:id", (req, res) => {
    mysql.execute("DELETE FROM money WHERE id = ?;", [req.params.id],
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
