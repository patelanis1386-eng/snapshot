import axios from 'axios';

const API = axios.create({ baseURL: '/api' });

API.interceptors.request.use((req) => {
  const user = JSON.parse(localStorage.getItem('snapclone_user'));
  if (user?.token) {
    req.headers.Authorization = `Bearer ${user.token}`;
  }
  return req;
});

export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  getMe: () => API.get('/auth/me'),
};

export const userAPI = {
  getUser: (id) => API.get(`/users/${id}`),
  updateUser: (data) => API.put('/users/update', data),
  followUser: (id) => API.post(`/users/follow/${id}`),
  searchUsers: (q) => API.get(`/users/search?q=${q}`),
};

export const storyAPI = {
  uploadStory: (data) => API.post('/stories/upload', data),
  getFeed: () => API.get('/stories/feed'),
  viewStory: (id) => API.post(`/stories/view/${id}`),
  deleteStory: (id) => API.delete(`/stories/${id}`),
};

export const postAPI = {
  createPost: (data) => API.post('/posts', data),
  getFeed: (page) => API.get(`/posts/feed?page=${page}`),
  likePost: (id) => API.post(`/posts/like/${id}`),
  commentOnPost: (id, text) => API.post(`/posts/comment/${id}`, { text }),
  deletePost: (id) => API.delete(`/posts/${id}`),
};

export const messageAPI = {
  sendMessage: (data) => API.post('/messages', data),
  getMessages: (userId) => API.get(`/messages/${userId}`),
  getConversations: () => API.get('/messages/conversations'),
  markAsRead: (userId) => API.put(`/messages/read/${userId}`),
};

export default API;
