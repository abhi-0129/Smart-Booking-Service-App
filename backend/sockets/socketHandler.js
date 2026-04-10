const jwt = require('jsonwebtoken');
require('dotenv').config();

const setupSocket = (io) => {
  // Authenticate socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      socket.user = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user?.id;
    console.log(`🔌 User ${userId} connected via Socket.io`);

    // Join personal room for targeted notifications
    socket.join(`user_${userId}`);

    socket.on('join_room', (room) => {
      socket.join(room);
    });

    socket.on('disconnect', () => {
      console.log(`❌ User ${userId} disconnected`);
    });
  });
};

module.exports = setupSocket;
