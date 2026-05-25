// controllers/shareController.js
// Handles file sharing logic — generating unique share links and serving shared file data publicly.
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import File from '../models/File.js';
import User from '../models/User.js';

// @desc    Generate a public share link for a file
// @route   POST /api/files/:id/share
// @access  Private (JWT protected — only the file owner can share)
export const shareFile = async (req, res) => {
  try {
    const fileId = req.params.id;

    // 1. Find the file in the database
    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // 2. Verify that the requesting user is the file owner (security check)
    if (file.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to share this file' });
    }

    // 3. Prevent sharing folders (only actual files can be shared)
    if (file.type === 'folder') {
      return res.status(400).json({ message: 'Folders cannot be shared via link' });
    }

    // 4. If already shared, return the existing share link (don't regenerate)
    if (file.isShared && file.shareId) {
      const frontendUrl = process.env.FRONTEND_URL || 'https://drive-nz9r.onrender.com';
      return res.status(200).json({
        success: true,
        message: 'File is already shared',
        shareId: file.shareId,
        shareUrl: `${frontendUrl}/shared/${file.shareId}`,
        file,
      });
    }

    // 5. Generate a unique, cryptographically random UUID using crypto.randomUUID()
    // and verify that it doesn't already exist in the database (prevent duplicate shareIds)
    let shareId;
    let isDuplicate = true;
    while (isDuplicate) {
      shareId = crypto.randomUUID();
      const existingFile = await File.findOne({ shareId });
      if (!existingFile) {
        isDuplicate = false;
      }
    }

    // 6. Update the file document with sharing metadata
    file.isShared = true;
    file.shareId = shareId;
    file.sharedAt = new Date();
    await file.save();

    // 7. Build and return the public share URL
    const frontendUrl = process.env.FRONTEND_URL || 'https://drive-nz9r.onrender.com';
    const shareUrl = `${frontendUrl}/shared/${shareId}`;

    res.status(200).json({
      success: true,
      message: 'File shared successfully',
      shareId,
      shareUrl,
      file,
    });
  } catch (error) {
    console.error('Error sharing file:', error);
    res.status(500).json({ message: 'Server error during file sharing' });
  }
};

// @desc    Get shared file data by its unique shareId (PUBLIC — no auth required)
// @route   GET /api/shared/:shareId
// @access  Public (anyone with the link can access)
export const getSharedFile = async (req, res) => {
  try {
    const { shareId } = req.params;

    // 1. Validate the shareId format (must be a standard UUID)
    if (!shareId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(shareId)) {
      return res.status(400).json({ message: 'Invalid share link format' });
    }

    // 2. Find the original file (the oldest one with this shareId) to ensure we always reference the owner's file
    const originalFile = await File.findOne({ shareId }).sort({ createdAt: 1 });
    if (!originalFile || !originalFile.isShared || originalFile.isDeleted) {
      return res.status(404).json({ message: 'This item is not shared or the link is invalid' });
    }

    const file = originalFile;

    // Optional: Copy the shared file to the logged-in child account's drive if they are not the owner
    let loggedInUserId = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        loggedInUserId = decoded.id;
      } catch (err) {
        console.log('Optional JWT verification in getSharedFile failed:', err.message);
      }
    }

    if (loggedInUserId && file.userId.toString() !== loggedInUserId) {
      const existingFile = await File.findOne({
        userId: loggedInUserId,
        fileUrl: file.fileUrl
      });
      if (!existingFile) {
        const fileCopy = new File({
          userId: loggedInUserId,
          fileName: file.fileName,
          fileUrl: file.fileUrl,
          size: file.size,
          type: file.type,
          relativePath: file.relativePath || file.fileName,
          isShared: true,
          shareId: file.shareId,
          sharedAt: file.sharedAt || new Date(),
        });
        await fileCopy.save();

        const childUser = await User.findById(loggedInUserId);
        if (childUser) {
          childUser.storageUsed = Math.min(childUser.storageLimit, childUser.storageUsed + file.size);
          await childUser.save();
        }
      } else {
        let needsSave = false;
        
        // If the copy was previously soft-deleted, restore it
        if (existingFile.isDeleted) {
          existingFile.isDeleted = false;
          needsSave = true;
          
          // Re-add to storage consumption
          const childUser = await User.findById(loggedInUserId);
          if (childUser) {
            childUser.storageUsed = Math.min(childUser.storageLimit, childUser.storageUsed + file.size);
            await childUser.save();
          }
        }
        
        if (!existingFile.isShared) {
          existingFile.isShared = true;
          existingFile.shareId = file.shareId;
          existingFile.sharedAt = file.sharedAt || new Date();
          needsSave = true;
        }
        
        if (needsSave) {
          await existingFile.save();
        }
      }
    }

    // 3. Fetch the file owner's public info (name and avatar only — never expose sensitive data)
    const owner = await User.findById(file.userId).select('name email avatar');

    // 4. Build the full download URL for the file
    const backendUrl = process.env.BACKEND_URL || 'https://shnoordrives.onrender.com';
    const downloadUrl = `${backendUrl}${file.fileUrl}`;

    // 5. Return the shared file metadata and owner info
    res.status(200).json({
      success: true,
      file: {
        _id: file._id,
        fileName: file.fileName,
        fileUrl: file.fileUrl,
        size: file.size,
        type: file.type,
        shareId: file.shareId,
        sharedAt: file.sharedAt,
        createdAt: file.createdAt,
      },
      owner: owner ? {
        name: owner.name,
        avatar: owner.avatar,
      } : { name: 'Unknown User', avatar: null },
      downloadUrl,
    });
  } catch (error) {
    console.error('Error retrieving shared file:', error);
    res.status(500).json({ message: 'Server error retrieving shared file' });
  }
};

// @desc    Get all shared files for the logged-in user
// @route   GET /api/files/shared-links
// @access  Private (JWT protected)
export const getSharedLinks = async (req, res) => {
  try {
    const userId = req.user.id;
    // Find all files belonging to the logged-in user that have been shared and are not deleted
    const files = await File.find({
      userId,
      isShared: true,
      isDeleted: { $ne: true }
    }).sort({ sharedAt: -1 });

    const formattedFiles = await Promise.all(
      files.map(async (file) => {
        let fileOwner = null;

        // If the file has a shareId, find the original file (oldest document with this shareId)
        if (file.shareId) {
          const originalFile = await File.findOne({
            shareId: file.shareId,
            isShared: true
          }).sort({ createdAt: 1 });

          if (originalFile) {
            fileOwner = await User.findById(originalFile.userId).select('name email avatar');
          }
        }

        // Fallback to the current user if no original file/owner was found
        if (!fileOwner) {
          fileOwner = await User.findById(file.userId).select('name email avatar');
        }

        return {
          _id: file._id,
          fileName: file.fileName,
          size: file.size,
          type: file.type,
          fileUrl: file.fileUrl,
          shareId: file.shareId,
          sharedAt: file.sharedAt,
          owner: fileOwner ? {
            name: fileOwner.name,
            email: fileOwner.email,
            avatar: fileOwner.avatar
          } : { name: 'Unknown User', email: '', avatar: null }
        };
      })
    );

    res.status(200).json({
      success: true,
      files: formattedFiles
    });
  } catch (error) {
    console.error('Error fetching shared links:', error);
    res.status(500).json({ message: 'Server error fetching shared links' });
  }
};

// @desc    Unshare a file (remove shared link)
// @route   PUT /api/files/:id/unshare
// @access  Private (JWT protected)
export const unshareFile = async (req, res) => {
  try {
    const fileId = req.params.id;
    const userId = req.user.id;

    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (file.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to unshare this file' });
    }

    file.isShared = false;
    file.shareId = null;
    file.sharedAt = null;
    await file.save();

    res.status(200).json({
      success: true,
      message: 'Shared link removed successfully',
      fileId
    });
  } catch (error) {
    console.error('Error unsharing file:', error);
    res.status(500).json({ message: 'Server error during unsharing' });
  }
};

