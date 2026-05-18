const Post = require('../models/Post');
const User = require('../models/User');

const createPost = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Media file is required' });
    }
    const mediaType = req.file.mimetype.startsWith('video') ? 'video' : 'image';
    const post = await Post.create({
      user: req.user._id,
      media: `/uploads/${req.file.filename}`,
      mediaType,
      caption: req.body.caption || '',
    });
    const populatedPost = await Post.findById(post._id).populate('user', 'username profilePicture');
    res.status(201).json(populatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const currentUser = await User.findById(req.user._id);
    const followedUsers = currentUser.following;
    followedUsers.push(req.user._id);
    const posts = await Post.find({ user: { $in: followedUsers } })
      .populate('user', 'username profilePicture')
      .populate('comments.user', 'username profilePicture')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);
    const total = await Post.countDocuments({ user: { $in: followedUsers } });
    res.json({
      posts,
      page,
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    const isLiked = post.likes.includes(req.user._id);
    if (isLiked) {
      post.likes.pull(req.user._id);
    } else {
      post.likes.push(req.user._id);
    }
    await post.save();
    res.json({ likes: post.likes, liked: !isLiked });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const commentOnPost = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ message: 'Comment text is required' });
    }
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    post.comments.push({ user: req.user._id, text });
    await post.save();
    const updatedPost = await Post.findById(post._id)
      .populate('user', 'username profilePicture')
      .populate('comments.user', 'username profilePicture');
    res.json(updatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await post.deleteOne();
    res.json({ message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createPost, getFeed, likePost, commentOnPost, deletePost };
