require('dotenv').config()
require('./utils/slotCleanup') // chạy job dọn slot hết hạn mỗi phút
const http = require('http')
const app = require('./app')
const connectDB = require('./config/db')
const { initSocket } = require("./sockets");
const startAppointmentCron = require("./utils/appoinmentCron");

const server = http.createServer(app)

connectDB()
initSocket(server)

server.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`)

  startAppointmentCron();
})

