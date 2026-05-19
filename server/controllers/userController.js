// controllers/userController.js
import User from '../models/User.js';
import File from '../models/File.js';

// @desc    Get user profile with storage stats and uploaded files
// @route   GET /api/user/profile
// @access  Private (JWT protected)
export const getUserProfile = async (req, res) => {
  try {
    // req.user.id is populated by the protect middleware
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find all files belonging to this user
    const files = await File.find({ userId: req.user.id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        storageUsed: user.storageUsed,
        storageLimit: user.storageLimit,
        createdAt: user.createdAt,
      },
      files,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving profile' });
  }
};
