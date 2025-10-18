// models/userModel.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true, // Ensures email uniqueness isn't case-sensitive
  },
  password: {
    type: String,
    required: true, // Note: This will store the password hash, not the plaintext password.
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model("User", userSchema, "users");

module.exports = User;
