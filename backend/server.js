const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const setupSocket = require('./sockets/socketHandler');
const fs = require('fs');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make io accessible in controllers via app
app.set('io', io);

// Initialize socket handlers
setupSocket(io);

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

server.listen(PORT, () => {
  console.log(`\n🚀 Smart Booking Server running on port ${PORT}`);
  console.log(`📡 Socket.io ready`);
  console.log(`🌐 API: http://localhost:${PORT}/api`);
});
