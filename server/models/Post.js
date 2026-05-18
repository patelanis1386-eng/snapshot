const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  media: {
    type: String,
    required: true,
  },
  mediaType: {
    type: String,
    enum: ['image', 'video'],
    default: 'image',
  },
  caption: {
    type: String,
    default: '',
    maxlength: 200,
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    text: {
      type: String,
      required: true,
      maxlength: 150,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);
