const Story = require('../models/Story');
const User = require('../models/User');

const uploadStory = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Media file is required' });
    }
    const mediaType = req.file.mimetype.startsWith('video') ? 'video' : 'image';
    const story = await Story.create({
      user: req.user._id,
      media: `/uploads/${req.file.filename}`,
      mediaType,
      caption: req.body.caption || '',
    });
    const populatedStory = await Story.findById(story._id).populate('user', 'username profilePicture');
    res.status(201).json(populatedStory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getFeed = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    const followedUsers = currentUser.following;
    followedUsers.push(req.user._id);
    const stories = await Story.find({
      user: { $in: followedUsers },
      expiresAt: { $gt: new Date() },
    })
      .populate('user', 'username profilePicture')
      .sort('-createdAt');
    const groupedStories = stories.reduce((acc, story) => {
      const userId = story.user._id.toString();
      if (!acc[userId]) {
        acc[userId] = {
          user: story.user,
          stories: [],
        };
      }
      acc[userId].stories.push(story);
      return acc;
    }, {});
    res.json(Object.values(groupedStories));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const viewStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }
    if (!story.viewedBy.includes(req.user._id)) {
      story.viewedBy.push(req.user._id);
      await story.save();
    }
    res.json({ message: 'Story viewed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }
    if (story.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await story.deleteOne();
    res.json({ message: 'Story deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { uploadStory, getFeed, viewStory, deleteStory };
