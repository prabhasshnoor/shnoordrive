// models/Folder.js
// Mongoose model to store virtual folders in a dedicated collection
import mongoose from 'mongoose';

const folderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  folderName: {
    type: String,
    required: true,
  },
  parentFolder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null, // null means it's a top-level root folder
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

export default mongoose.model('Folder', folderSchema);
