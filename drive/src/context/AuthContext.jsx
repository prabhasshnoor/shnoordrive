// src/context/AuthContext.jsx
// Streamlined AuthContext responsible solely for authentication states, profile settings, and login flows
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const navigate = useNavigate();

  // Load user from localStorage on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Check token validation on mount
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

  // Register function
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

  // Login function
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

  // Logout function
  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  // Google Login function (Firebase integration)
  const loginWithGoogle = async () => {
    try {
      const { signInWithPopup } = await import('firebase/auth');
      const { auth, provider } = await import('../firebase');
      
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      
      // Sync Google user profile on backend
      const response = await api.post('/auth/google-sync', {
        email: firebaseUser.email,
        name: firebaseUser.displayName || 'Google User'
      });

      const appUser = {
        _id: response.data._id,
        name: response.data.name,
        email: response.data.email,
        token: response.data.token,
        isFirebase: false
      };

      localStorage.setItem('user', JSON.stringify(appUser));
      setUser(appUser);
      navigate('/drive');
      return { success: true };
    } catch (error) {
      console.error('Google sync failed', error);
      return { success: false, message: error.response?.data?.message || error.message || 'Google Login failed' };
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
