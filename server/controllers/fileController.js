// controllers/fileController.js
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import File from '../models/File.js';
import User from '../models/User.js';
import Folder from '../models/Folder.js';

// Configure Multer storage to keep original file names with timestamps to avoid collisions
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads';
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Create multer upload instance
export const upload = multer({ storage: storage });

// @desc    Upload file & check storage limits
// @route   POST /api/files/upload
// @access  Private (JWT protected)
export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // req.user.id comes from protect middleware
    const user = await User.findById(req.user.id);
    if (!user) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if storage capacity is exceeded
    const nextStorageUsed = user.storageUsed + req.file.size;
    if (nextStorageUsed > user.storageLimit) {
      // Exceeds limit -> delete file physically and return error
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ message: 'Storage limit exceeded' });
    }

    // Save metadata in MongoDB
    const file = await File.create({
      userId: user._id,
      fileName: req.file.originalname,
      fileUrl: `/uploads/${req.file.filename}`,
      size: req.file.size,
      type: req.file.mimetype,
      relativePath: req.body.relativePath || '',
    });

    // Update user's storage consumption
    user.storageUsed = nextStorageUsed;
    await user.save();

    res.status(201).json({
      success: true,
      file,
      storageUsed: user.storageUsed,
      storageLimit: user.storageLimit,
    });
  } catch (error) {
    console.error(error);
    // Cleanup disk on server failure
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Server error during upload' });
  }
};

// @desc    Create virtual folder
// @route   POST /api/files/create-folder
// @access  Private (JWT protected)
export const createFolder = async (req, res) => {
  try {
    const { folderName } = req.body;
    if (!folderName) {
      return res.status(400).json({ message: 'Folder name is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 1. Create in Dedicated Folder collection
    const folderRecord = await Folder.create({
      userId: user._id,
      folderName,
      parentFolder: null,
    });

    // 2. Create virtual File collection reference (for priority sorted grid rendering)
    const fileRecord = await File.create({
      userId: user._id,
      fileName: folderName,
      fileUrl: '', // No physical URL for virtual directories
      size: 0,
      type: 'folder',
      relativePath: folderName,
      folderId: folderRecord._id,
    });

    res.status(201).json({
      success: true,
      file: fileRecord,
      folderRecord,
      storageUsed: user.storageUsed,
      storageLimit: user.storageLimit,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during folder creation' });
  }
};

// @desc    Delete a file or folder (Soft delete to Bin, or Permanent delete if already inside Bin)
// @route   DELETE /api/files/:id
// @access  Private (JWT protected)
export const deleteFile = async (req, res) => {
  try {
    const fileId = req.params.id;

    // Find the file first
    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Ensure users can only delete their own files
    if (file.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to delete this file' });
    }

    // A. SOFT DELETE: If not already marked as deleted, move to the Bin!
    if (!file.isDeleted) {
      file.isDeleted = true;
      await file.save();

      // If it's a folder, mark the Folder record as deleted too
      if (file.type === 'folder' && file.folderId) {
        await Folder.findByIdAndUpdate(file.folderId, { isDeleted: true });
      }

      // Also reduce storage on soft delete so active drive consumption is updated instantly in real-time
      const user = await User.findById(req.user.id);
      if (user) {
        user.storageUsed = Math.max(0, user.storageUsed - file.size);
        await user.save();
      }

      return res.status(200).json({
        success: true,
        message: 'Moved to bin successfully',
        softDeleted: true,
        storageUsed: user ? user.storageUsed : 0,
        storageLimit: user ? user.storageLimit : 104857600,
      });
    }

    // B. PERMANENT DELETE: If already inside the Bin, clear permanently!
    // 1. Delete physical file from disk if it is not a virtual folder
    if (file.type !== 'folder' && file.fileUrl) {
      const filePath = path.join(process.cwd(), file.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      } else {
        console.warn(`File not found on disk at: ${filePath}`);
      }
    } else if (file.type === 'folder' && file.folderId) {
      // Clean up the corresponding Folder collection record as well
      await Folder.findByIdAndDelete(file.folderId);
    }

    // 2. Reduce user's storage consumption
    const user = await User.findById(req.user.id);
    if (user) {
      user.storageUsed = Math.max(0, user.storageUsed - file.size); // Prevent negative storage numbers
      await user.save();
    }

    // 3. Delete metadata from MongoDB File collection
    await File.findByIdAndDelete(fileId);

    res.status(200).json({
      success: true,
      message: 'Permanently deleted successfully',
      storageUsed: user ? user.storageUsed : 0,
      storageLimit: user ? user.storageLimit : 104857600,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during file deletion' });
  }
};

// @desc    Get recent file uploads (excluding deleted items)
// @route   GET /api/files/recent
// @access  Private (JWT protected)
export const getRecentFiles = async (req, res) => {
  try {
    // Only show current user's uploads (Req 3, 12), excluding soft-deleted items
    const recentFiles = await File.find({ 
      userId: req.user.id, 
      type: { $ne: 'folder' },
      isDeleted: { $ne: true }
    })
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      files: recentFiles,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving recent files' });
  }
};

// @desc    Restore a soft-deleted file or folder from the Bin
// @route   PUT /api/files/:id/restore
// @access  Private (JWT protected)
export const restoreFile = async (req, res) => {
  try {
    const fileId = req.params.id;

    // Find the file first
    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Ensure users can only restore their own files
    if (file.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to restore this file' });
    }

    // Restore the file record
    file.isDeleted = false;
    await file.save();

    // If it's a folder, restore the Folder collection record too
    if (file.type === 'folder' && file.folderId) {
      await Folder.findByIdAndUpdate(file.folderId, { isDeleted: false });
    }

    const user = await User.findById(req.user.id);
    if (user) {
      user.storageUsed = Math.min(user.storageLimit, user.storageUsed + file.size);
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'Item restored successfully',
      storageUsed: user ? user.storageUsed : 0,
      storageLimit: user ? user.storageLimit : 104857600,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during file restoration' });
  }
};
