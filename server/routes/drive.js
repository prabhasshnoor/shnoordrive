// routes/drive.js
// Mounts GET /api/drive endpoint protected by JWT
import express from 'express';
import protect from '../middleware/auth.js';
import Folder from '../models/Folder.js';
import File from '../models/File.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import path from 'path';

const router = express.Router();

// @route   GET /api/drive
// @desc    Retrieve all user folders and non-folder files
// @access  Private (JWT protected)
router.get('/', protect, async (req, res) => {
  try {
    // Only show current user's non-deleted data (Req 12)
    const folders = await Folder.find({ userId: req.user.id, isDeleted: { $ne: true } });
    // Fix: Remove the restriction type: { $ne: 'folder' } so virtual folder entries are fetched under files and rendered
    const files = await File.find({ userId: req.user.id, isDeleted: { $ne: true } });

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

// @route   PATCH /api/drive/rename/:id
// @desc    Rename a file or folder
// @access  Private (JWT protected)
router.patch('/rename/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    let { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    name = name.trim();

    // 1. Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }

    // 2. Retrieve the File document
    const file = await File.findById(id);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File or folder not found' });
    }

    // 3. Ensure user owns the file
    if (file.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to rename this item' });
    }

    // 4. Handle based on item type (file vs folder)
    if (file.type === 'folder') {
      // Ensure folderId exists
      if (!file.folderId) {
        return res.status(400).json({ success: false, message: 'Folder association is missing' });
      }

      // Check for duplicate folder names at root for this user
      const duplicateFolder = await Folder.findOne({
        userId: req.user.id,
        folderName: { $regex: new RegExp(`^${name}$`, 'i') },
        isDeleted: { $ne: true },
        _id: { $ne: file.folderId }
      });

      if (duplicateFolder) {
        return res.status(400).json({ success: false, message: 'A folder with this name already exists' });
      }

      const oldFolderName = file.fileName;

      // Update actual Folder record
      const folderRecord = await Folder.findByIdAndUpdate(
        file.folderId,
        { folderName: name },
        { new: true }
      );

      // Update relativePath for files inside this folder
      const oldPrefix = `${oldFolderName}/`;
      const newPrefix = `${name}/`;
      const filesInFolder = await File.find({
        userId: req.user.id,
        relativePath: new RegExp(`^${oldPrefix}`)
      });

      for (const f of filesInFolder) {
        if (f.relativePath.startsWith(oldPrefix)) {
          f.relativePath = newPrefix + f.relativePath.substring(oldPrefix.length);
          await f.save();
        }
      }

      // Update folder's own File document
      file.fileName = name;
      file.relativePath = name;
      await file.save();

      const responseItem = file.toObject();
      responseItem.name = file.fileName;

      return res.status(200).json({
        success: true,
        message: 'Renamed successfully',
        item: responseItem,
        folderRecord
      });

    } else {
      // It is a file
      const originalExt = path.extname(file.fileName);
      let targetName = name;

      // Extension preservation and tampering check
      if (originalExt) {
        const targetExt = path.extname(targetName);
        if (targetExt.toLowerCase() !== originalExt.toLowerCase()) {
          // If a different extension was provided, remove it and append the original
          if (targetExt) {
            targetName = targetName.slice(0, -targetExt.length) + originalExt;
          } else {
            targetName = targetName + originalExt;
          }
        }
      }

      // Check for duplicates inside the same folder context
      let duplicateQuery = {
        userId: req.user.id,
        isDeleted: { $ne: true },
        _id: { $ne: file._id }
      };

      let newRelativePath = '';

      if (file.relativePath && file.relativePath.includes('/')) {
        const slashIndex = file.relativePath.lastIndexOf('/');
        const folderPrefix = file.relativePath.substring(0, slashIndex);
        newRelativePath = `${folderPrefix}/${targetName}`;
        duplicateQuery.relativePath = newRelativePath;
      } else {
        // Root file duplicate check
        duplicateQuery.fileName = targetName;
        duplicateQuery.$or = [
          { relativePath: { $exists: false } },
          { relativePath: '' },
          { relativePath: { $not: /\// } }
        ];
      }

      const duplicateFile = await File.findOne(duplicateQuery);
      if (duplicateFile) {
        return res.status(400).json({ success: false, message: 'A file with this name already exists in this directory' });
      }

      // Update fields
      file.fileName = targetName;
      if (file.relativePath) {
        if (file.relativePath.includes('/')) {
          const slashIndex = file.relativePath.lastIndexOf('/');
          const folderPrefix = file.relativePath.substring(0, slashIndex);
          file.relativePath = `${folderPrefix}/${targetName}`;
        } else {
          file.relativePath = targetName;
        }
      }
      await file.save();

      const responseItem = file.toObject();
      responseItem.name = file.fileName;

      return res.status(200).json({
        success: true,
        message: 'Renamed successfully',
        item: responseItem
      });
    }

  } catch (error) {
    console.error('Error during rename:', error);
    res.status(500).json({ success: false, message: 'Server error renaming file or folder' });
  }
});

// @route   PATCH /api/drive/move/file/:id
// @desc    Move a file to a folder or root My Drive
// @access  Private (JWT protected)
router.patch('/move/file/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { destinationFolderId } = req.body; // Folder ID, or null/empty string for root My Drive

    // 1. Validate File MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid file ID format' });
    }

    // 2. Retrieve File document
    const file = await File.findById(id);
    if (!file || file.type === 'folder') {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    // 3. Verify user owns the file
    if (file.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to move this file' });
    }

    let destPath = '';
    let parentFolderId = null;

    // 4. Resolve destination details
    if (destinationFolderId && destinationFolderId !== 'root') {
      if (!mongoose.Types.ObjectId.isValid(destinationFolderId)) {
        return res.status(400).json({ success: false, message: 'Invalid destination folder ID format' });
      }

      // Ensure destination folder exists and is owned by the user
      const destFolder = await Folder.findOne({
        _id: destinationFolderId,
        userId: req.user.id,
        isDeleted: { $ne: true }
      });

      if (!destFolder) {
        return res.status(404).json({ success: false, message: 'Destination folder not found' });
      }

      parentFolderId = destFolder._id;

      // Find the virtual File record for this folder to retrieve its relativePath prefix
      const destVirtualFile = await File.findOne({
        folderId: destFolder._id,
        type: 'folder',
        userId: req.user.id
      });
      destPath = destVirtualFile ? destVirtualFile.relativePath : destFolder.folderName;
    }

    // 5. Compute new relative path
    const newRelativePath = destPath ? `${destPath}/${file.fileName}` : file.fileName;

    // 6. Check for duplicate filename in destination directory
    let duplicateQuery = {
      userId: req.user.id,
      isDeleted: { $ne: true },
      _id: { $ne: file._id }
    };

    if (parentFolderId) {
      duplicateQuery.relativePath = newRelativePath;
    } else {
      duplicateQuery.fileName = file.fileName;
      duplicateQuery.$or = [
        { relativePath: { $exists: false } },
        { relativePath: '' },
        { relativePath: { $not: /\// } }
      ];
    }

    const duplicateFile = await File.findOne(duplicateQuery);
    if (duplicateFile) {
      return res.status(400).json({ success: false, message: 'A file with this name already exists in the destination folder' });
    }

    // 7. Perform the move
    file.folderId = parentFolderId;
    file.relativePath = newRelativePath;
    await file.save();

    const responseItem = file.toObject();
    responseItem.name = file.fileName;

    res.status(200).json({
      success: true,
      message: 'File moved successfully',
      item: responseItem
    });

  } catch (error) {
    console.error('Error moving file:', error);
    res.status(500).json({ success: false, message: 'Server error moving file' });
  }
});

// @route   PATCH /api/drive/move/folder/:id
// @desc    Move a folder and all its contents to a destination folder or root My Drive
// @access  Private (JWT protected)
router.patch('/move/folder/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { destinationFolderId } = req.body; // Folder ID, or null/empty string for root My Drive

    // 1. Validate virtual Folder File ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid folder ID format' });
    }

    // 2. Retrieve File document
    const file = await File.findById(id);
    if (!file || file.type !== 'folder') {
      return res.status(404).json({ success: false, message: 'Folder not found' });
    }

    // 3. Verify user owns the folder
    if (file.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to move this folder' });
    }

    const folderId = file.folderId; // The actual Folder ID
    if (!folderId) {
      return res.status(400).json({ success: false, message: 'Folder association is missing' });
    }

    let destPath = '';
    let parentFolderId = null;

    // 4. Resolve destination details
    if (destinationFolderId && destinationFolderId !== 'root') {
      if (!mongoose.Types.ObjectId.isValid(destinationFolderId)) {
        return res.status(400).json({ success: false, message: 'Invalid destination folder ID format' });
      }

      // Check if trying to move folder into itself
      if (folderId.toString() === destinationFolderId.toString()) {
        return res.status(400).json({ success: false, message: 'Cannot move a folder into itself' });
      }

      // Ensure destination folder exists and is owned by the user
      const destFolder = await Folder.findOne({
        _id: destinationFolderId,
        userId: req.user.id,
        isDeleted: { $ne: true }
      });

      if (!destFolder) {
        return res.status(404).json({ success: false, message: 'Destination folder not found' });
      }

      // Prevent moving folder into its own subfolders (circular hierarchy validation)
      let checkId = destFolder.parentFolder;
      while (checkId) {
        if (checkId.toString() === folderId.toString()) {
          return res.status(400).json({ success: false, message: 'Cannot move a folder into one of its subfolders' });
        }
        const tempFolder = await Folder.findById(checkId);
        checkId = tempFolder ? tempFolder.parentFolder : null;
      }

      parentFolderId = destFolder._id;

      // Find destination path
      const destVirtualFile = await File.findOne({
        folderId: destFolder._id,
        type: 'folder',
        userId: req.user.id
      });
      destPath = destVirtualFile ? destVirtualFile.relativePath : destFolder.folderName;
    }

    // 5. Compute new folder path
    const newFolderPath = destPath ? `${destPath}/${file.fileName}` : file.fileName;

    // 6. Check for duplicate folder names in destination directory
    const duplicateFolder = await Folder.findOne({
      userId: req.user.id,
      folderName: { $regex: new RegExp(`^${file.fileName}$`, 'i') },
      parentFolder: parentFolderId,
      isDeleted: { $ne: true },
      _id: { $ne: folderId }
    });

    if (duplicateFolder) {
      return res.status(400).json({ success: false, message: 'A folder with this name already exists in the destination folder' });
    }

    const oldFolderPath = file.relativePath;

    // 7. Update parentFolder in Folder collection
    const folderRecord = await Folder.findByIdAndUpdate(
      folderId,
      { parentFolder: parentFolderId },
      { new: true }
    );

    // 8. Update paths recursively for all files/folders inside this folder
    const oldPrefix = `${oldFolderPath}/`;
    const newPrefix = `${newFolderPath}/`;
    const childItems = await File.find({
      userId: req.user.id,
      relativePath: new RegExp(`^${oldPrefix}`)
    });

    for (const child of childItems) {
      if (child.relativePath.startsWith(oldPrefix)) {
        child.relativePath = newPrefix + child.relativePath.substring(oldPrefix.length);
        await child.save();
      }
    }

    // 9. Update the folder's virtual File record relativePath
    file.relativePath = newFolderPath;
    await file.save();

    const responseItem = file.toObject();
    responseItem.name = file.fileName;

    res.status(200).json({
      success: true,
      message: 'Folder moved successfully',
      item: responseItem,
      folderRecord
    });

  } catch (error) {
    console.error('Error moving folder:', error);
    res.status(500).json({ success: false, message: 'Server error moving folder' });
  }
});

export default router;
