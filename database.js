const mysql = require("mysql2")
const {createClient} = require("redis")


module.exports.mysql = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
    database: process.env.MYSQL_DB
})

const redisClient = createClient({
    legacyMode: "true",
    socket: {
        host: process.env.REDIS_HOST
    },
    username: process.env.REDIS_USER,
    password: process.env.REDIS_PASS
})
redisClient.on('error', (err) => console.log('Redis Client Error', err))
redisClient.connect()

module.exports.redisClient = redisClient


