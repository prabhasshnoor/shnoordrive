// routes/share.js
// Share feature routes — connects share endpoints to the Express router
// Includes rate limiting on the share generation endpoint to prevent abuse
import express from 'express';
import rateLimit from 'express-rate-limit';
import protect from '../middleware/auth.js';
import { shareFile, getSharedFile, getSharedLinks, unshareFile } from '../controllers/shareController.js';

const router = express.Router();

// --- Rate Limiter for Share Generation using express-rate-limit ---
// Limits each IP to 10 share link generations per minute to prevent abuse
const shareRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 requests per minute
  message: { message: 'Too many share link generations from this IP. Please try again after a minute.' },
  standardHeaders: true, // Return rate limit info in standard Headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
});

// @route   GET /api/files/shared-links
// @desc    Get all shared files for the logged-in user
// @access  Private (JWT protected)
router.get('/files/shared-links', protect, getSharedLinks);

// @route   POST /api/files/:id/share
// @desc    Generate a public share link for a file (rate-limited)
// @access  Private (JWT protected)
router.post('/files/:id/share', protect, shareRateLimiter, shareFile);

// @route   PUT /api/files/:id/unshare
// @desc    Unshare a file (remove shared link)
// @access  Private (JWT protected)
router.put('/files/:id/unshare', protect, unshareFile);

// @route   GET /api/shared/:shareId
// @desc    Get shared file data by share ID (public — no login required)
// @access  Public
router.get('/shared/:shareId', getSharedFile);

export default router;

