const admin = require('firebase-admin');
const User = require('../models/User');

const register = async (req, res) => {
  try {
    const { idToken, username } = req.body;
    if (!idToken || !username) {
      return res.status(400).json({ message: 'Token and username are required' });
    }
    const decoded = await admin.auth().verifyIdToken(idToken);
    const { uid, email } = decoded;
    const existingUser = await User.findById(uid);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: 'Username already taken' });
    }
    const user = await User.create({
      _id: uid,
      email,
      username,
    });
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      bio: user.bio,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: 'Token is required' });
    }
    const decoded = await admin.auth().verifyIdToken(idToken);
    const { uid, email } = decoded;
    const user = await User.findById(uid);
    if (!user) {
      return res.status(404).json({ message: 'User not found. Please register.' });
    }
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      bio: user.bio,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { register, login, getMe };
