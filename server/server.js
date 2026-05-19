import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import fileRoutes from './routes/file.js';
import userRoutes from './routes/user.js';
import driveRoutes from './routes/drive.js';
import protectedRoutes from './routes/protected.js';

dotenv.config();
connectDB();

const app = express();

// Configure CORS for production (Render deployment) and local development
const allowedOrigins = [
  'http://localhost:5173',            // Standard local React Vite port
  'http://localhost:3000',
  process.env.FRONTEND_URL            // Dynamic Render frontend URL configured via environment variables
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// Create uploads folder statically on process load if not present
const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Base route
app.get('/', (req, res) => {
  res.send('API Running');
});

// Auth routes
app.use('/api/auth', authRoutes);

// File management routes
app.use('/api/files', fileRoutes);

// User profile & storage routes
app.use('/api/user', userRoutes);

// Dedicated drive contents routes
app.use('/api/drive', driveRoutes);

// Protected example route
app.use('/api/protected', protectedRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
// Triggering nodemon reload to refresh .env variables