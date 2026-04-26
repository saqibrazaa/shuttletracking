const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  fatherName: {
    type: String
  },
  department: {
    type: String
  },
  semester: {
    type: String
  },
  rollNumber: {
    type: String
  },
  dob: {
    type: String
  },
  phoneNumber: {
    type: String
  },
  cnic: {
    type: String
  },
  vehicleNumber: {
    type: String
  },
  employeeId: {
    type: String
  },
  profilePicture: {
    type: String
  },
  role: {
    type: String,
    enum: ['student', 'driver', 'admin'],
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
