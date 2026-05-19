// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();

  // If there is no user, redirect to the login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Otherwise, render the children (the protected component)
  return children;
};

export default ProtectedRoute;
