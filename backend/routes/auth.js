const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');

const JWT_SECRET = 'kinetic_fluidity_secret_key_123';

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = './uploads';
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// @route POST /api/auth/register
// @desc Register a user
router.post('/register', upload.single('profilePicture'), async (req, res) => {
  const { 
    name, email, password, role, 
    fatherName, department, semester, rollNumber, dob, phoneNumber,
    cnic, vehicleNumber, employeeId
  } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ msg: 'Please enter all fields' });
  }

  // Prevent public admin registration implicitly (optional security measure based on front-end, but enforced here)
  if (role === 'admin') {
    return res.status(403).json({ msg: 'Cannot register as admin through this portal' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ msg: 'User already exists' });

    const newUser = new User({ 
      name, 
      email, 
      password, 
      role,
      fatherName,
      department,
      semester,
      rollNumber,
      dob,
      phoneNumber,
      cnic,
      vehicleNumber,
      employeeId,
      profilePicture: req.file ? req.file.path : null
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    newUser.password = await bcrypt.hash(password, salt);

    await newUser.save();

    // Sign the token
    const token = jwt.sign({ id: newUser._id, role: newUser.role }, JWT_SECRET, { expiresIn: '1d' });

    res.json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// @route POST /api/auth/login
// @desc Auth user & get token
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ msg: 'Please enter all fields' });
  }

  try {
    // Check for existing user
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'User does not exist' });

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        fatherName: user.fatherName,
        department: user.department,
        semester: user.semester,
        rollNumber: user.rollNumber,
        dob: user.dob,
        phoneNumber: user.phoneNumber,
        profilePicture: user.profilePicture
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// @route PUT /api/auth/profile/:id
// @desc Update user profile
router.put('/profile/:id', upload.single('profilePicture'), async (req, res) => {
    try {
        const updateData = { ...req.body };
        if (req.file) {
            updateData.profilePicture = req.file.path;
        }

        const user = await User.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true });
        
        if (!user) return res.status(404).json({ msg: 'User not found' });

        res.json({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            fatherName: user.fatherName,
            department: user.department,
            semester: user.semester,
            rollNumber: user.rollNumber,
            dob: user.dob,
            phoneNumber: user.phoneNumber,
            profilePicture: user.profilePicture
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route GET /api/auth/users
// @desc Get all registered students and drivers
router.get('/users', async (req, res) => {
    try {
        const users = await User.find({ role: { $in: ['student', 'driver'] } }).select('-password');
        const students = users.filter(u => u.role === 'student');
        const drivers = users.filter(u => u.role === 'driver');
        res.json({ students, drivers });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

const crypto = require('crypto');

// @route POST /api/auth/forgot-password
// @desc Request password reset
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ msg: 'User with this email does not exist' });

        const token = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        await user.save();

        // SIMULATION: In a real app, use Nodemailer to send this link
        const resetUrl = `http://localhost:5175/reset-password/${token}`;
        console.log(`\n--- PASSWORD RESET SIMULATION ---\nTo: ${email}\nLink: ${resetUrl}\n---------------------------------\n`);

        res.json({ msg: 'Reset link has been generated and sent to your email (simulated)' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route POST /api/auth/reset-password/:token
// @desc Reset password using token
router.post('/reset-password/:token', async (req, res) => {
    const { password } = req.body;
    try {
        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) return res.status(400).json({ msg: 'Password reset token is invalid or has expired' });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();
        res.json({ msg: 'Password has been updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route DELETE /api/auth/users/:id
// @desc Delete a student or driver account
router.delete('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        // Ensure we don't accidentally delete admins this way
        if (user.role === 'admin') {
            return res.status(403).json({ msg: 'Cannot delete administrator accounts' });
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Account deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
