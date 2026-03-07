require('dotenv').config()
const http = require('http')
const app = require('./app')
const connectDB = require('./config/db')
const { initSocket } = require("./sockets");

const server = http.createServer(app)

connectDB()
initSocket(server)

server.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`)
})

