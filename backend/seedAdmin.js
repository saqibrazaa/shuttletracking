const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const MONGO_URI = 'mongodb://localhost:27017/shuttleTracker';

async function seedAdmin() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    const adminExists = await User.findOne({ email: 'admin@shuttle.com' });
    if (adminExists) {
      console.log('Admin user already exists.');
      process.exit();
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const admin = new User({
      name: 'Super Admin',
      email: 'admin@shuttle.com',
      password: hashedPassword,
      role: 'admin'
    });

    await admin.save();
    console.log('Admin user created successfully!');
    console.log('Email: admin@shuttle.com');
    console.log('Password: admin123');
    
    process.exit();
  } catch (err) {
    console.error('Error seeding admin:', err);
    process.exit(1);
  }
}

seedAdmin();
