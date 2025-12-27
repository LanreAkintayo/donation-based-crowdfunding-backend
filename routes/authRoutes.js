const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/userModel"); 


const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post("/login", async (req, res) => {
  try {
    const { loginIdentifier, password } = req.body;

    // Validate input
    if (!loginIdentifier || !password) {
      return res.status(400).json({ message: "Please provide login credentials" });
    }

    // Check for user by email or username
    const user = await User.findOne({
      $or: [{ email: loginIdentifier }, { username: loginIdentifier }],
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Create JWT payload
    const payload = {
      id: user._id, 
    };

    // Sign and return the token
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "24h" }, // Token expires in 1 hour
      (err, token) => {
        if (err) throw err;
        res.status(200).json({
          message: "Logged in successfully",
          token: token,
        });
      }
    );
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server Error" });
  }
});



// GOOGLE LOGIN
// @route   POST /api/auth/google-login
router.post("/google-login", async (req, res) => {
  try {
    const { token } = req.body;

    // A. Verify the token with Google
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    // Get user info from the token payload
    const { name, email, picture } = ticket.getPayload();

    // B. Check if this user already exists in your DB
    let user = await User.findOne({ email });

    if (!user) {
      // USER IS NEW: We must create them.
      // We generate a random dummy password because your DB likely requires a password field.
      const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      // Generate a username from email (john@gmail.com -> john4821)
      const baseUsername = email.split("@")[0];
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const username = `${baseUsername}${randomSuffix}`;

      user = new User({
        fullName: name,
        username: username,
        email: email,
        password: hashedPassword, // Dummy password (user won't know it, they use Google)
      });

      await user.save();
    }

    // C. User Exists (or was just created) -> Generate Token
    const payload = {
      id: user._id,
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
      (err, token) => {
        if (err) throw err;
        res.status(200).json({
            message: "Google login successful",
            token: token,
            user: { 
                id: user._id,
                username: user.username,
                email: user.email
             }
        });
      }
    );

  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(400).json({ message: "Google authentication failed" });
  }
});

module.exports = router;