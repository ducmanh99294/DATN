require('dotenv').config()

const mongoUri = process.env.MONGO_URI?.trim()
if (!mongoUri) {
  console.error(
    '[backend] Missing MONGO_URI. Create a .env file in the backend folder (see .env.example) and set your MongoDB connection string.'
  )
  process.exit(1)
}

const PORT = Number(process.env.PORT) || 3000

require('./utils/slotCleanup') // chạy job dọn slot hết hạn mỗi phút
const http = require('http')
const app = require('./app')
const connectDB = require('./config/db')
const { initSocket } = require("./sockets");
const startAppointmentCron = require("./utils/appoinmentCron");

const server = http.createServer(app)

connectDB()
initSocket(server)

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)

  startAppointmentCron();
})

