
import express from 'express';
import { uploadFile, deleteFile, upload, createFolder, getRecentFiles, restoreFile } from '../controllers/fileController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/files/recent
// @desc    Get recent file uploads
// @access  Private (JWT protected)
router.get('/recent', protect, getRecentFiles);

// @route   POST /api/files/upload
// @desc    Upload a single file
// @access  Private
router.post('/upload', protect, upload.single('file'), uploadFile);

// @route   POST /api/files/create-folder
// @desc    Create a virtual directory folder
// @access  Private
router.post('/create-folder', protect, createFolder);

// @route   PUT /api/files/:id/restore
// @desc    Restore a soft-deleted file or folder
// @access  Private
router.put('/:id/restore', protect, restoreFile);

// @route   DELETE /api/files/:id
// @desc    Delete a single file or directory folder
// @access  Private
router.delete('/:id', protect, deleteFile);

export default router;
