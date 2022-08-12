require("dotenv").config()
const express = require("express")
const app = express()
const PORT = 4000
const morgan = require("morgan")

if (process.env.NODE_ENV === "production") {
    app.use(morgan("[:date[web]] :req[X-Real-IP] -> :method :url -> [:status] :response-time ms"))
} else {
    app.use(morgan("[:date[web]] :remote-addr -> :method :url -> [:status] :response-time ms"))
}

app.use(express.json())

app.use("/api", require("./api"))

app.get("/", (req, res) => {
    res.send("Hello!")
})

app.listen(PORT, () => {
    console.log("Server started.")
})
