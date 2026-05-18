const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    ref: 'User',
    required: true,
  },
  receiver: {
    type: String,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    default: '',
  },
  media: {
    type: String,
    default: '',
  },
  mediaType: {
    type: String,
    enum: ['image', 'video', ''],
    default: '',
  },
  read: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
