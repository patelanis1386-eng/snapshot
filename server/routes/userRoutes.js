const express = require('express');
const router = express.Router();
const { getUser, updateUser, followUser, searchUsers } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const upload = require('../utils/upload');

router.get('/search', protect, searchUsers);
router.get('/:id', protect, getUser);
router.put('/update', protect, upload.single('profilePicture'), updateUser);
router.post('/follow/:id', protect, followUser);

module.exports = router;
