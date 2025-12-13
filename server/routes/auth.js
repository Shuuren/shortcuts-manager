const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateToken, requireAuth } = require('../middleware/auth');

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, password, displayName } = req.body;

    // Check if username exists
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Create new user (always as 'client' role for registration)
    const user = new User({
      username: username.toLowerCase(),
      password,
      displayName: displayName || username,
      role: 'client'
    });

    await user.save();

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Debug logging
    console.log('Login attempt:', { username, passwordLength: password?.length, body: req.body });

    // Find user
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Generate token
    const token = generateToken(user);

    res.json({
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Get current user profile
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      id: user._id,
      username: user.username,
      displayName: user.displayName,
      role: user.role
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update profile
router.put('/me', requireAuth, async (req, res) => {
  try {
    const { displayName, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update display name if provided
    if (displayName !== undefined) {
      user.displayName = displayName;
    }

    // Update password if provided
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password required to change password' });
      }
      
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
      
      user.password = newPassword;
    }

    await user.save();

    // Generate new token with updated info
    const token = generateToken(user);

    res.json({
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
