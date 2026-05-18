const express = require('express');
const router = express.Router();
const { sendMessage, getMessages, getConversations, markAsRead } = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

router.post('/', protect, sendMessage);
router.get('/conversations', protect, getConversations);
router.get('/:userId', protect, getMessages);
router.put('/read/:userId', protect, markAsRead);

module.exports = router;
