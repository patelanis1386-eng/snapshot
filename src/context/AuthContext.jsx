import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../services/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { authAPI } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          const res = await authAPI.getMe();
          setUser({ ...res.data, token });
          await connectSocket();
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await cred.user.getIdToken();
    const res = await authAPI.login({ idToken });
    setUser({ ...res.data, token: idToken });
    await connectSocket();
  };

  const register = async (email, password, username) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const idToken = await cred.user.getIdToken();
    const res = await authAPI.register({ idToken, username });
    setUser({ ...res.data, token: idToken });
    await connectSocket();
  };

  const logout = async () => {
    await signOut(auth);
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
