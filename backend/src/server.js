require('dotenv').config()
const http = require('http')
const app = require('./app')
const connectDB = require('./config/db')
const setupSocket = require('./sockets')

const server = http.createServer(app)

connectDB()
setupSocket(server)

server.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`)
})
