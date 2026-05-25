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
import shareRoutes from './routes/share.js';

dotenv.config();
connectDB();

const app = express();

// Configure CORS (Cross-Origin Resource Sharing) to allow requests from specific frontend origins
// This resolves the browser's "Access-Control-Allow-Origin" headers errors during MERN production deployment
app.use(cors({
   origin: [
      "http://localhost:5173",          // Local React development server
      "https://drive-nz9r.onrender.com" // Deployed production React app on Render
   ],
   credentials: true                    // Allows cookies/headers to be sent between frontend and backend
}));

// Setup Express JSON parsing middleware
// CRITICAL: This MUST be defined before defining any route middleware so incoming JSON request bodies (req.body) are successfully parsed.
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

// Share feature routes (POST /api/files/:id/share & GET /api/shared/:shareId)
app.use('/api', shareRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
// Triggering nodemon reload to refresh .env variables