// routes/drive.js
// Mounts GET /api/drive endpoint protected by JWT
import express from 'express';
import protect from '../middleware/auth.js';
import Folder from '../models/Folder.js';
import File from '../models/File.js';
import User from '../models/User.js';

const router = express.Router();

// @route   GET /api/drive
// @desc    Retrieve all user folders and non-folder files
// @access  Private (JWT protected)
router.get('/', protect, async (req, res) => {
  try {
    // Only show current user's non-deleted data (Req 12)
    const folders = await Folder.find({ userId: req.user.id, isDeleted: { $ne: true } });
    const files = await File.find({ userId: req.user.id, type: { $ne: 'folder' }, isDeleted: { $ne: true } });

    res.status(200).json({
      success: true,
      folders,
      files,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving drive contents' });
  }
});

// @route   GET /api/drive/storage
// @desc    Get storage statistics and all user files sorted by size descending
// @access  Private (JWT protected)
router.get('/storage', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Retrieve active user files (excluding soft-deleted ones and folder markers since folders have 0 size)
    const files = await File.find({
      userId: req.user.id,
      type: { $ne: 'folder' },
      isDeleted: { $ne: true }
    }).sort({ size: -1 }); // Sort by largest size first

    const storageUsed = user.storageUsed;
    const storageLimit = user.storageLimit;
    const percentage = storageLimit > 0 ? (storageUsed / storageLimit) * 100 : 0;

    res.status(200).json({
      success: true,
      storageUsed,
      storageLimit,
      percentage,
      files,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving storage stats' });
  }
});

export default router;
