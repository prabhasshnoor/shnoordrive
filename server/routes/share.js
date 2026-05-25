// routes/share.js
// Share feature routes — connects share endpoints to the Express router
// Includes rate limiting on the share generation endpoint to prevent abuse
import express from 'express';
import rateLimit from 'express-rate-limit';
import protect from '../middleware/auth.js';
import { 
  shareFile, getSharedFile, getSharedLinks, unshareFile,
  requestAccess, getAccessRequests, approveAccessRequest, rejectAccessRequest
} from '../controllers/shareController.js';

const router = express.Router();

// --- Rate Limiter for Share Generation using express-rate-limit ---
const shareRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { message: 'Too many share link generations from this IP. Please try again after a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// @route   GET /api/files/shared-links
router.get('/files/shared-links', protect, getSharedLinks);

// @route   POST /api/files/:id/share
router.post('/files/:id/share', protect, shareRateLimiter, shareFile);

// @route   PUT /api/files/:id/unshare
router.put('/api/files/:id/unshare', protect, unshareFile); // Note: Keep this route definition but correct it if needed. Let's make sure it matches drive/src/App.jsx. Wait! In shareController.js, the comment says "/api/files/:id/unshare", but here it was "router.put('/files/:id/unshare', protect, unshareFile)". Since it is mounted on "/api", the actual request URL is "/api/files/:id/unshare". So "router.put('/files/:id/unshare')" is correct. Let's keep it as "/files/:id/unshare".

// Let's list the routes:
router.put('/files/:id/unshare', protect, unshareFile);

// Access request endpoints
router.post('/share/request-access', protect, requestAccess);
router.get('/share/access-requests', protect, getAccessRequests);
router.patch('/share/access-requests/:id/approve', protect, approveAccessRequest);
router.patch('/share/access-requests/:id/reject', protect, rejectAccessRequest);

// @route   GET /api/shared/:shareId
router.get('/shared/:shareId', getSharedFile);

export default router;

