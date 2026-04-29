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
// const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/shuttleTracker';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/shuttleTracker';
// const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://engrsaqibrazaa_db_user:Rlbv4uK1cSJI3i1W@saqib0.ltgyiw3.mongodb.net/shuttleTracker?appName=Saqib0';
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
// Store live driver positions so new connections see them immediately
const liveDriversMap = {};

io.on('connection', (socket) => {
  console.log('User connected for live tracking:', socket.id);

  // Send all currently active live drivers to this newly connected client
  const activeLiveDrivers = Object.values(liveDriversMap);
  if (activeLiveDrivers.length > 0) {
    socket.emit('activeLiveDrivers', activeLiveDrivers);
  }

  socket.on('updateLocation', (data) => {
    // Persist live driver state on the server
    if (data.isLive && data.id) {
      liveDriversMap[data.id] = { ...data, lastSeen: Date.now() };
    }
    // Broadcast to all OTHER connected clients
    socket.broadcast.emit('locationUpdate', data);
  });

  socket.on('driverOffline', (driverId) => {
    delete liveDriversMap[driverId];
    // Relay to all other clients
    socket.broadcast.emit('driverOffline', driverId);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/vehicles', require('./routes/vehicle'));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Backend server running with Socket.io on port ${PORT}`));
