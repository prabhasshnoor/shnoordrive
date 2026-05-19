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
    default: null
  },
  googleId: {
    type: String,
    default: null
  },
  avatar: {
    type: String,
    default: null
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  storageUsed: {
    type: Number,
    default: 0,
  },
  storageLimit: {
    type: Number,
    default: 100 * 1024 * 1024,
  },
}, { timestamps: true });

export default mongoose.model('User', userSchema);
