const Message = require('../models/Message');

const sendMessage = async (req, res) => {
  try {
    const { receiverId, text } = req.body;
    if (!receiverId) {
      return res.status(400).json({ message: 'Receiver ID is required' });
    }
    const message = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      text: text || '',
    });
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username profilePicture')
      .populate('receiver', 'username profilePicture');
    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user._id },
      ],
    })
      .populate('sender', 'username profilePicture')
      .populate('receiver', 'username profilePicture')
      .sort('createdAt');
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getConversations = async (req, res) => {
  try {
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: req.user._id },
            { receiver: req.user._id },
          ],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: null,
          users: {
            $addToSet: {
              $cond: [
                { $eq: ['$sender', req.user._id] },
                '$receiver',
                '$sender',
              ],
            },
          },
        },
      },
    ]);
    const userIds = messages[0]?.users || [];
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: req.user._id, receiver: { $in: userIds } },
            { receiver: req.user._id, sender: { $in: userIds } },
          ],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', req.user._id] },
              '$receiver',
              '$sender',
            ],
          },
          lastMessage: { $first: '$$ROOT' },
        },
      },
      { $sort: { 'lastMessage.createdAt': -1 } },
    ]);
    await Message.populate(conversations, {
      path: '_id',
      select: 'username profilePicture isOnline lastSeen',
    });
    res.json(conversations.map((c) => ({
      user: c._id,
      lastMessage: c.lastMessage,
    })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    await Message.updateMany(
      { sender: req.params.userId, receiver: req.user._id, read: false },
      { read: true }
    );
    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { sendMessage, getMessages, getConversations, markAsRead };
