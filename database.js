const mysql = require("mysql2")
const {createClient} = require("redis")

module.exports.mysql = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "admin",
    database: "family"
})

const redisClient = createClient({
    legacyMode: "true",
    socket: {
        host: "fogline.ivi.pl"
    },
    username: "default",
    password: "redis@12"
})
redisClient.on('error', (err) => console.log('Redis Client Error', err))
redisClient.connect()

module.exports.redisClient = redisClient


