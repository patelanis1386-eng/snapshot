import { io } from 'socket.io-client';

let socket = null;

export const connectSocket = (token) => {
  if (socket?.connected) return socket;
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
