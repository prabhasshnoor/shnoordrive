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
}, { timestamps: true });

export default mongoose.model('File', fileSchema);
