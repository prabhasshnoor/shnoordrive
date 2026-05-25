// controllers/shareController.js
// Handles file sharing logic — generating unique share links and serving shared file data.
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import File from '../models/File.js';
import User from '../models/User.js';
import SharedLink from '../models/SharedLink.js';
import AccessRequest from '../models/AccessRequest.js';

// @desc    Generate a public/private share link for a file
// @route   POST /api/files/:id/share
// @access  Private (JWT protected — only the file owner can share)
export const shareFile = async (req, res) => {
  try {
    const fileId = req.params.id;
    const { visibility } = req.body; // 'public' or 'private'

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

    // 4. Find or create SharedLink configuration
    let sharedLink = await SharedLink.findOne({ fileId: file._id });
    if (!sharedLink) {
      let shareId;
      let isDuplicate = true;
      while (isDuplicate) {
        shareId = crypto.randomUUID();
        const existingLink = await SharedLink.findOne({ shareId });
        if (!existingLink) {
          isDuplicate = false;
        }
      }
      sharedLink = new SharedLink({
        fileId: file._id,
        ownerId: req.user.id,
        visibility: visibility || 'public',
        shareId,
        allowedUsers: []
      });
      await sharedLink.save();
    } else {
      if (visibility) {
        sharedLink.visibility = visibility;
        await sharedLink.save();
      }
    }

    // 5. Update the file document with sharing metadata
    file.isShared = true;
    file.shareId = sharedLink.shareId;
    file.sharedAt = sharedLink.createdAt;
    await file.save();

    // 6. Build and return the share URL
    const frontendUrl = process.env.FRONTEND_URL || 'https://drive-nz9r.onrender.com';
    const shareUrl = `${frontendUrl}/shared/${sharedLink.shareId}`;

    res.status(200).json({
      success: true,
      message: 'File shared successfully',
      shareId: sharedLink.shareId,
      shareUrl,
      visibility: sharedLink.visibility,
      file,
    });
  } catch (error) {
    console.error('Error sharing file:', error);
    res.status(500).json({ message: 'Server error during file sharing' });
  }
};

// @desc    Get shared file data by its unique shareId
// @route   GET /api/shared/:shareId
// @access  Public (visibility checks applied inside)
export const getSharedFile = async (req, res) => {
  try {
    const { shareId } = req.params;

    // 1. Validate the shareId format (must be a standard UUID)
    if (!shareId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(shareId)) {
      return res.status(400).json({ message: 'Invalid share link format' });
    }

    // 2. Find the SharedLink configuration
    const sharedLink = await SharedLink.findOne({ shareId });
    if (!sharedLink) {
      return res.status(404).json({ message: 'This item is not shared or the link is invalid' });
    }

    // 3. Find the original file
    const file = await File.findOne({ _id: sharedLink.fileId, isDeleted: { $ne: true } });
    if (!file) {
      return res.status(404).json({ message: 'This item is not shared or the link is invalid' });
    }

    // Fetch the file owner's public info
    const owner = await User.findById(sharedLink.ownerId).select('name email avatar');
    const ownerName = owner ? owner.name : 'Unknown User';
    const ownerEmail = owner ? owner.email : '';
    const ownerAvatar = owner ? owner.avatar : null;

    // Optional: Determine if requesting user is authenticated
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

    // 4. Handle Visibility checks
    if (sharedLink.visibility === 'private') {
      // If not authenticated, indicate auth is required to request access
      if (!loggedInUserId) {
        return res.status(200).json({
          success: false,
          requiresAuth: true,
          visibility: 'private',
          owner: { name: ownerName, email: ownerEmail, avatar: ownerAvatar },
          file: { fileName: file.fileName, size: file.size, type: file.type }
        });
      }

      const isOwner = file.userId.toString() === loggedInUserId;
      const isAllowed = sharedLink.allowedUsers.includes(loggedInUserId);

      // If neither owner nor allowed, deny direct file access and return pending request state
      if (!isOwner && !isAllowed) {
        const existingRequest = await AccessRequest.findOne({
          requesterId: loggedInUserId,
          sharedLinkId: sharedLink._id
        });

        return res.status(200).json({
          success: false,
          requiresAccess: true,
          hasPendingRequest: existingRequest ? existingRequest.status === 'pending' : false,
          requestStatus: existingRequest ? existingRequest.status : null,
          owner: { name: ownerName, email: ownerEmail, avatar: ownerAvatar },
          file: { fileName: file.fileName, size: file.size, type: file.type },
          visibility: 'private'
        });
      }
    }

    // 5. File is public or user has permission (isOwner or isAllowed)
    // Optional cloning: copy the file to the logged-in child account's drive if they are not the owner
    if (loggedInUserId && file.userId.toString() !== loggedInUserId) {
      const existingFileCopy = await File.findOne({
        userId: loggedInUserId,
        fileUrl: file.fileUrl
      });
      if (!existingFileCopy) {
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
        if (existingFileCopy.isDeleted) {
          existingFileCopy.isDeleted = false;
          needsSave = true;
          
          const childUser = await User.findById(loggedInUserId);
          if (childUser) {
            childUser.storageUsed = Math.min(childUser.storageLimit, childUser.storageUsed + file.size);
            await childUser.save();
          }
        }
        
        if (!existingFileCopy.isShared) {
          existingFileCopy.isShared = true;
          existingFileCopy.shareId = file.shareId;
          existingFileCopy.sharedAt = file.sharedAt || new Date();
          needsSave = true;
        }
        
        if (needsSave) {
          await existingFileCopy.save();
        }
      }
    }

    const backendUrl = process.env.BACKEND_URL || 'https://shnoordrives.onrender.com';
    const downloadUrl = `${backendUrl}${file.fileUrl}`;

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
        email: owner.email
      } : { name: 'Unknown User', avatar: null, email: '' },
      downloadUrl,
      visibility: sharedLink.visibility
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
    const files = await File.find({
      userId,
      isShared: true,
      isDeleted: { $ne: true }
    }).sort({ sharedAt: -1 });

    const formattedFiles = await Promise.all(
      files.map(async (file) => {
        let fileOwner = null;

        // Find the SharedLink visibility configuration
        const sharedLink = await SharedLink.findOne({ fileId: file._id });
        const visibility = sharedLink ? sharedLink.visibility : 'public';

        if (file.shareId) {
          const originalFile = await File.findOne({
            shareId: file.shareId,
            isShared: true
          }).sort({ createdAt: 1 });

          if (originalFile) {
            fileOwner = await User.findById(originalFile.userId).select('name email avatar');
          }
        }

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
          visibility,
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

// @desc    Unshare a file (remove shared link configuration)
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

    // Clean up corresponding SharedLink and AccessRequest configurations
    await SharedLink.findOneAndDelete({ fileId });
    await AccessRequest.deleteMany({ fileId });

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

// @desc    Submit an access request for a private shared link
// @route   POST /api/share/request-access
// @access  Private (JWT protected)
export const requestAccess = async (req, res) => {
  try {
    const { shareId, requestedRole, message } = req.body;

    if (!shareId) {
      return res.status(400).json({ message: 'shareId is required' });
    }

    const sharedLink = await SharedLink.findOne({ shareId });
    if (!sharedLink) {
      return res.status(404).json({ message: 'Shared link configuration not found' });
    }

    // Verify link requires access request
    if (sharedLink.visibility !== 'private') {
      return res.status(400).json({ message: 'Access requests are only needed for private shared links' });
    }

    // Prevent owner from requesting access to their own file
    if (sharedLink.ownerId.toString() === req.user.id) {
      return res.status(400).json({ message: 'You are the owner of this file' });
    }

    const request = await AccessRequest.findOneAndUpdate(
      { requesterId: req.user.id, sharedLinkId: sharedLink._id },
      { 
        ownerId: sharedLink.ownerId, 
        fileId: sharedLink.fileId, 
        requestedRole: requestedRole || 'viewer', 
        message: message || '', 
        status: 'pending' 
      },
      { new: true, upsert: true }
    );

    res.status(201).json({
      success: true,
      message: 'Access request submitted successfully',
      request
    });
  } catch (error) {
    console.error('Error requesting access:', error);
    res.status(500).json({ message: 'Server error requesting access' });
  }
};

// @desc    Retrieve pending access requests for files owned by logged-in user
// @route   GET /api/share/access-requests
// @access  Private (JWT protected)
export const getAccessRequests = async (req, res) => {
  try {
    const requests = await AccessRequest.find({
      ownerId: req.user.id,
      status: 'pending'
    })
      .populate('requesterId', 'name email avatar')
      .populate('fileId', 'fileName size type')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      requests
    });
  } catch (error) {
    console.error('Error fetching access requests:', error);
    res.status(500).json({ message: 'Server error fetching access requests' });
  }
};

// @desc    Approve access request
// @route   PATCH /api/share/access-requests/:id/approve
// @access  Private (JWT protected)
export const approveAccessRequest = async (req, res) => {
  try {
    const requestId = req.params.id;

    const request = await AccessRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Access request not found' });
    }

    if (request.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to approve this request' });
    }

    request.status = 'approved';
    await request.save();

    // Add requester to allowedUsers list in SharedLink
    const sharedLink = await SharedLink.findById(request.sharedLinkId);
    if (sharedLink) {
      if (!sharedLink.allowedUsers.includes(request.requesterId)) {
        sharedLink.allowedUsers.push(request.requesterId);
        await sharedLink.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Access request approved successfully',
      request
    });
  } catch (error) {
    console.error('Error approving request:', error);
    res.status(500).json({ message: 'Server error approving request' });
  }
};

// @desc    Reject access request
// @route   PATCH /api/share/access-requests/:id/reject
// @access  Private (JWT protected)
export const rejectAccessRequest = async (req, res) => {
  try {
    const requestId = req.params.id;

    const request = await AccessRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Access request not found' });
    }

    if (request.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to reject this request' });
    }

    request.status = 'rejected';
    await request.save();

    res.status(200).json({
      success: true,
      message: 'Access request rejected successfully',
      request
    });
  } catch (error) {
    console.error('Error rejecting request:', error);
    res.status(500).json({ message: 'Server error rejecting request' });
  }
};
