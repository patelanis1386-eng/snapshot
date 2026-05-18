const express = require('express');
const router = express.Router();
const { createPost, getFeed, likePost, commentOnPost, deletePost } = require('../controllers/postController');
const { protect } = require('../middleware/auth');
const upload = require('../utils/upload');

router.post('/', protect, upload.single('media'), createPost);
router.get('/feed', protect, getFeed);
router.post('/like/:id', protect, likePost);
router.post('/comment/:id', protect, commentOnPost);
router.delete('/:id', protect, deletePost);

module.exports = router;
