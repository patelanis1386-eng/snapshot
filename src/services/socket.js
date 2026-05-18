import { io } from 'socket.io-client';
import { auth } from './firebase';

let socket = null;

export const connectSocket = async () => {
  if (socket?.connected) return socket;
  const user = auth.currentUser;
  if (!user) return null;
  const token = await user.getIdToken();
  const url = import.meta.env.VITE_API_URL || '/';
  socket = io(url, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
