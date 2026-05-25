// middleware/auth.js
// Middleware to protect routes using JSON Web Tokens (JWT)

import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const protect = async (req, res, next) => {
  let token;

  // Check if the authorization header exists and starts with "Bearer"
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extract token from the header (format: "Bearer <token>")
      token = req.headers.authorization.split(' ')[1];

      // Verify the token using the secret key from environment variables
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find the user by ID from the decoded token and exclude the password from the result
      req.user = await User.findById(decoded.id).select('-password');

      // Move to the next middleware or route handler
      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  // If no token was found
  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

export default protect;
