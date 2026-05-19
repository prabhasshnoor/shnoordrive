// routes/auth.js
// Authentication routes for register, login, and get current user (me)

import express from 'express';
import { registerUser, loginUser, getCurrentUser, forgotPassword, resetPassword, googleLoginSync } from '../controllers/authController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', registerUser);

// @route   POST /api/auth/login
// @desc    Login user and return JWT token
// @access  Public
router.post('/login', loginUser);

// @route   POST /api/auth/google-sync
// @desc    Synchronize Google/Firebase user with MongoDB and issue standard JWT
// @access  Public
router.post('/google-sync', googleLoginSync);

// @route   GET /api/auth/me
// @desc    Get authenticated user's profile
// @access  Private (requires JWT)
// Notice how we use the 'protect' middleware to secure this route
router.get('/me', protect, getCurrentUser);

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', forgotPassword);

// @route   POST /api/auth/reset-password/:token
// @desc    Reset password
// @access  Public
router.post('/reset-password/:token', resetPassword);

export default router;
