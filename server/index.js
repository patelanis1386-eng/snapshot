const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const storyRoutes = require('./routes/storyRoutes');
const postRoutes = require('./routes/postRoutes');
const messageRoutes = require('./routes/messageRoutes');
const { apiLimiter } = require('./middleware/rateLimiter');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(apiLimiter);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/messages', messageRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'SnapClone API is running' });
});

const activeUsers = new Map();

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', async (socket) => {
  const userId = socket.userId;
  activeUsers.set(userId, socket.id);
  await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });
  io.emit('userStatus', { userId, isOnline: true });

  socket.join(userId);

  socket.on('joinConversation', (conversationId) => {
    socket.join(conversationId);
  });

  socket.on('sendMessage', async (data) => {
    const { receiverId, text } = data;
    const Message = require('./models/Message');
    try {
      const message = await Message.create({
        sender: userId,
        receiver: receiverId,
        text,
      });
      const populatedMessage = await Message.findById(message._id)
        .populate('sender', 'username profilePicture')
        .populate('receiver', 'username profilePicture');
      io.to(receiverId).emit('newMessage', populatedMessage);
      socket.emit('newMessage', populatedMessage);
      const receiverSocketId = activeUsers.get(receiverId);
      if (!receiverSocketId) {
        io.to(receiverId).emit('messageNotification', {
          from: userId,
          text: text.substring(0, 50),
        });
      }
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('typing', (data) => {
    const { receiverId, isTyping } = data;
    io.to(receiverId).emit('typing', { userId, isTyping });
  });

  socket.on('disconnect', async () => {
    activeUsers.delete(userId);
    await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
    io.emit('userStatus', { userId, isOnline: false });
  });
});

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error('MongoDB connection error:', err));
