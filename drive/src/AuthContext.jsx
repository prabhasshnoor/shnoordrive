import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, provider } from './firebase';
import { signInWithPopup, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const stored = {
          uid: currentUser.uid,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
          email: currentUser.email,
        };
        localStorage.setItem('authUser', JSON.stringify(stored));
      } else {
        localStorage.removeItem('authUser');
      }
    });
    // Load from localStorage on init in case Firebase hasn't emitted yet
    const persisted = localStorage.getItem('authUser');
    if (persisted && !user) {
      setUser(JSON.parse(persisted));
    }
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, provider);
      // user state will be updated by onAuthStateChanged
    } catch (error) {
      console.error('Google sign-in failed', error);
      throw error;
    }
  };

  const signOutUser = async () => {
    try {
      await firebaseSignOut(auth);
      // onAuthStateChanged will set user to null
      navigate('/login');
    } catch (error) {
      console.error('Sign out failed', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, signInWithGoogle, signOut: signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
