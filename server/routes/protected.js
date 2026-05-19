// routes/protected.js
// Example of a protected route using JWT middleware

import express from 'express';
import protect from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/protected/data
// @desc    Get some protected data
// @access  Private (requires JWT)
router.get('/data', protect, (req, res) => {
  res.status(200).json({
    message: 'This is protected data',
    user: req.user, // Information about the currently logged in user
  });
});

export default router;
