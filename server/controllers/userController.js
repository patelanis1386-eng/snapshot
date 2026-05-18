const User = require('../models/User');
const fs = require('fs');
const path = require('path');

const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { username, bio } = req.body;
    const updateData = {};
    if (username) updateData.username = username;
    if (bio !== undefined) updateData.bio = bio;
    if (req.file) {
      const oldUser = await User.findById(req.user._id);
      if (oldUser.profilePicture) {
        const oldPath = path.join(__dirname, '..', oldUser.profilePicture);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      updateData.profilePicture = `/uploads/${req.file.filename}`;
    }
    const user = await User.findByIdAndUpdate(req.user._id, updateData, { new: true }).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const followUser = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }
    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);
    if (!userToFollow) {
      return res.status(404).json({ message: 'User not found' });
    }
    const isFollowing = currentUser.following.includes(req.params.id);
    if (isFollowing) {
      currentUser.following.pull(req.params.id);
      userToFollow.followers.pull(req.user._id);
    } else {
      currentUser.following.push(req.params.id);
      userToFollow.followers.push(req.user._id);
    }
    await currentUser.save();
    await userToFollow.save();
    res.json({ following: !isFollowing });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const searchUsers = async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
      ],
    }).select('-password').limit(20);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getUser, updateUser, followUser, searchUsers };
