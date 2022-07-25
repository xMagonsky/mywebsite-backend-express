require("dotenv").config()
const express = require("express")
const app = express()
const PORT = 4000


app.use(express.json())

app.use("/api", require("./api"))

app.get("/", (req, res) => {
    res.send("elo")
})

app.listen(PORT)
