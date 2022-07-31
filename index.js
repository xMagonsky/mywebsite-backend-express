require("dotenv").config()
const express = require("express")
const app = express()
const PORT = 4000
const morgan = require("morgan")

app.use(morgan("[:date[web]] :remote-addr :remote-user -> HTTP/:http-version :method :url -> [:status] :response-time ms"))

app.use(express.json())

app.use("/api", require("./api"))

app.get("/", (req, res) => {
    res.send("elo")
})

app.listen(PORT)
