const express = require("express");
const router = express.Router();
const User = require("../models/userModel"); // Import the User model
const bcrypt = require("bcrypt");
const { protect } = require('../middleware/authMiddleware');

// POST route to add a new user
router.post("/add-user", async (req, res) => {
  try {
    const { fullName, username, email, password } = req.body;

    // Simple validation
    if (!fullName || !username || !email || !password) {
      return res.status(400).json({ message: "Please enter all fields" });
    }

    // 2. Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      username,
      email,
      password: hashedPassword, // 3. Save the hashed password
    });

    const savedUser = await newUser.save();

    // Return the new user's data, excluding the password
    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: savedUser._id,
        fullName: savedUser.fullName,
        username: savedUser.username,
        email: savedUser.email,
      },
    });
  } catch (error) {
    // Check for duplicate key error from MongoDB
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ message: "Username or email already taken" });
    }
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// @route   GET /all-users
// @desc    Get all registered users
router.get("/all-users", async (req, res) => {
  try {
    // Fetch all users and exclude their passwords from the response
    const users = await User.find().select('-password');
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});


// @desc    Get current user data
// @route   GET /api/users/me
// @access  Private
router.get("/me", protect, (req, res) => {
    // We don't need to find user again. 'protect' already did it!
    // We just send back what 'protect' found.
    res.status(200).json(req.user);
});

module.exports = router;
