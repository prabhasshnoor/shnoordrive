// config/db.js
// Connect to MongoDB Atlas using Mongoose.
// This file is imported in server.js to establish the DB connection.

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected successfully.');
  } catch (error) {
    console.error('========================================================================');
    console.error('MongoDB connection error:', error.message || error);
    console.error('------------------------------------------------------------------------');
    console.error('WARNING: Express server is STILL RUNNING on port 5000, but database is offline.');
    console.error('Please make sure your IP is whitelisted on MongoDB Atlas:');
    console.error('https://www.mongodb.com/docs/atlas/security-whitelist/');
    console.error('========================================================================');
  }
};

export default connectDB;
