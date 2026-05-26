
import mongoose from 'mongoose';

const accessRequestSchema = new mongoose.Schema({
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    required: true
  },
  sharedLinkId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SharedLink',
    required: true
  },
  requestedRole: {
    type: String,
    enum: ['viewer', 'commenter', 'editor'],
    default: 'viewer'
  },
  message: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, { timestamps: true });

export default mongoose.model('AccessRequest', accessRequestSchema);
