const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  user: {
    type: String,
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
    maxlength: 100,
  },
  viewedBy: [{
    type: String,
    ref: 'User',
  }],
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
  },
}, { timestamps: true });

storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Story', storySchema);
