import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

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
    setUser(null);
    navigate('/login');
  };

  const loginWithGoogle = async () => {
    try {
      const { signInWithPopup } = await import('firebase/auth');
      const { auth, provider } = await import('../firebase');
      
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      
      const email = firebaseUser.email || '';
      const emailLower = email.toLowerCase();
      const isValidDomain = emailLower.endsWith('@gmail.com') || emailLower.endsWith('@shnoor.com') || emailLower.endsWith('@shnoor');
      
      if (!isValidDomain) {
        const { signOut } = await import('firebase/auth');
        await signOut(auth);
        return { success: false, message: 'Only Gmail and Shnoor accounts are allowed to join' };
      }

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
