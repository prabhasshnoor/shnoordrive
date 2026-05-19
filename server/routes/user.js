// routes/user.js
import express from 'express';
import { getUserProfile } from '../controllers/userController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/user/profile
// @desc    Get user storage status and owned files list
// @access  Private (JWT protected)
router.get('/profile', protect, getUserProfile);

export default router;
