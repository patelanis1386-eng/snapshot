const express = require('express');
const router = express.Router();
const { uploadStory, getFeed, viewStory, deleteStory } = require('../controllers/storyController');
const { protect } = require('../middleware/auth');
const upload = require('../utils/upload');

router.post('/upload', protect, upload.single('media'), uploadStory);
router.get('/feed', protect, getFeed);
router.post('/view/:id', protect, viewStory);
router.delete('/:id', protect, deleteStory);

module.exports = router;
