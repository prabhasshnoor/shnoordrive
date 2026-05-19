// models/User.js
// Mongoose model for User
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  storageUsed: {
    type: Number,
    default: 0, // 0 bytes initially
  },
  storageLimit: {
    type: Number,
    default: 104857600, // 100 MB in bytes (100 * 1024 * 1024)
  },
}, { timestamps: true });

export default mongoose.model('User', userSchema);
