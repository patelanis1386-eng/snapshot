import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('snapclone_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.token) {
      connectSocket(user.token);
    }
    setLoading(false);
  }, [user?.token]);

  const login = async (data) => {
    const res = await authAPI.login(data);
    localStorage.setItem('snapclone_user', JSON.stringify(res.data));
    setUser(res.data);
    connectSocket(res.data.token);
  };

  const register = async (data) => {
    const res = await authAPI.register(data);
    localStorage.setItem('snapclone_user', JSON.stringify(res.data));
    setUser(res.data);
    connectSocket(res.data.token);
  };

  const logout = () => {
    localStorage.removeItem('snapclone_user');
    disconnectSocket();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
