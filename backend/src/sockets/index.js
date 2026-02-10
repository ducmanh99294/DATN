const { Server } = require('socket.io')
const jwt = require('jsonwebtoken')
const User = require("../models/User");

module.exports = (server) => {
  const io = new Server(server, {
    cors: {
      origin: 'http://localhost:3000',
      credentials: true
    }
  })

  io.use( async (socket, next) => {
    const token = socket.handshake.auth?.token;
    const user = await User.findById(decoded.id);
    if (!token) return next(new Error('No token'))

    try {
      const user = jwt.verify(token, process.env.JWT_ACCESS_SECRET)
     
      if (!user || user.isBanned) {
        return next(new Error("User is banned"));
      }
      
      socket.user = user
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.user.id)

    socket.on('message', (msg) => {
      io.emit('message', msg)
    })
  })
}
