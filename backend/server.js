const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/shuttleTracker';
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Socket.io for Real-time tracking
io.on('connection', (socket) => {
  console.log('User connected for live tracking:', socket.id);

  socket.on('updateLocation', (data) => {
    // Broadcast the new coordinates to all connected clients
    socket.broadcast.emit('locationUpdate', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Backend server running with Socket.io on port ${PORT}`));
