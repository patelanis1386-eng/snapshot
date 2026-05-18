import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDek9S4CUaJEzLoeHKo2plH4Y0gmuPycVk",
  authDomain: "snapshotttt.firebaseapp.com",
  projectId: "snapshotttt",
  storageBucket: "snapshotttt.firebasestorage.app",
  messagingSenderId: "729314258710",
  appId: "1:729314258710:web:f46f5fe0a130c42b7a6a37",
  measurementId: "G-668HR79GHB",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
