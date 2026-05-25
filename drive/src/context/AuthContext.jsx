import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (user && !user.isFirebase) {
      verifyToken();
    }
  }, [user]);

  const verifyToken = async () => {
    try {
      await api.get('/user/profile');
    } catch (error) {
      console.error('Token verification failure, logging out user:', error);
      if (error.response?.status === 401) {
        logout();
      }
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await api.post('/auth/register', { name, email, password });
      if (response.data) {
        localStorage.setItem('user', JSON.stringify(response.data));
        setUser(response.data);
        navigate('/drive');
        return { success: true };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      return { success: false, message };
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data) {
        localStorage.setItem('user', JSON.stringify(response.data));
        setUser(response.data);
        navigate('/drive');
        return { success: true };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  const loginWithGoogle = async () => {
    try {
      // Import Firebase Auth tools dynamically
      const { signInWithPopup } = await import('firebase/auth');
      const { auth, provider: googleProvider } = await import('../firebase');
      
      // Trigger Firebase popup Google login (ignore browser COOP warnings in development)
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      // Synchronize the authenticated Google/Firebase user data with our Node.js backend
      const response = await axios.post(
         import.meta.env.VITE_API_BASE_URL + "/auth/google-sync",
         {
            name: firebaseUser.displayName,
            email: firebaseUser.email,
            googleId: firebaseUser.uid,
            avatar: firebaseUser.photoURL
         },
         { withCredentials: true }
      );

      // Store JWT token and user profile in localStorage for session persistence
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      // Update auth state and redirect to dashboard
      setUser(response.data.user);
      navigate('/drive');
      return { success: true };
    } catch (error) {
      console.log("GOOGLE LOGIN ERROR:", error);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || 'Google Login failed' 
      };
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, register, login, logout, loginWithGoogle, loadingProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
