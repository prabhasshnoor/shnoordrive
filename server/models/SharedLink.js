// models/SharedLink.js
import mongoose from 'mongoose';

const sharedLinkSchema = new mongoose.Schema({
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    required: true
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  visibility: {
    type: String,
    enum: ['public', 'private'],
    default: 'public'
  },
  allowedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: []
  }],
  shareId: {
    type: String,
    required: true,
    unique: true,
    index: true
  }
}, { timestamps: true });

export default mongoose.model('SharedLink', sharedLinkSchema);
