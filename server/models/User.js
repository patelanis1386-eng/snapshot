const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  profilePicture: {
    type: String,
    default: '',
  },
  bio: {
    type: String,
    default: '',
    maxlength: 150,
  },
  followers: [{
    type: String,
    ref: 'User',
  }],
  following: [{
    type: String,
    ref: 'User',
  }],
  isOnline: {
    type: Boolean,
    default: false,
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true, _id: false });

module.exports = mongoose.model('User', userSchema);
