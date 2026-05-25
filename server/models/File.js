// models/File.js
// Mongoose model to store uploaded file metadata
import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  fileUrl: {
    type: String,
    default: '',
  },
  size: {
    type: Number, // in bytes
    required: true,
  },
  type: {
    type: String, // MIME type (e.g. image/jpeg)
    required: true,
  },
  relativePath: {
    type: String,
    default: '',
  },
  folderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  // --- Sharing Feature Fields ---
  // Whether this file has been shared via a public link
  isShared: {
    type: Boolean,
    default: false,
  },
  // Unique identifier used in the public share URL (e.g., /shared/:shareId)
  shareId: {
    type: String,
    index: true,   // Index for fast lookups when someone opens a shared link
    sparse: true,  // Sparse so files without shareId don't waste index space
    default: null,
  },
  // Timestamp recording when the file was first shared
  sharedAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

export default mongoose.model('File', fileSchema);
