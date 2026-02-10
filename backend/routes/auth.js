import express from 'express';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

const router = express.Router();

// Simple in-memory user store (replace with database in production)
const users = new Map();
const emailTokens = new Map();

// Email configuration (Gmail SMTP)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Simple username/password login (test user)
router.post('/login', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email required' });
    }

    // For testing: any email works, generates JWT directly
    const token = jwt.sign(
      { email, userId: email.split('@')[0] },
      process.env.JWT_SECRET || 'test-secret-key',
      { expiresIn: '30d' }
    );

    res.json({ 
      message: 'Login successful',
      token,
      email 
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Verify email token and create JWT
router.post('/verify', (req, res) => {
  try {
    const { token } = req.body;
    
    const tokenData = emailTokens.get(token);
    if (!tokenData) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    if (tokenData.expiresAt < Date.now()) {
      emailTokens.delete(token);
      return res.status(400).json({ error: 'Token expired' });
    }

    const { email } = tokenData;
    
    // Create or update user
    if (!users.has(email)) {
      users.set(email, { email, createdAt: new Date(), orders: [] });
    }

    // Create JWT
    const jwt_token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '30d' });
    
    // Clean up token
    emailTokens.delete(token);

    res.json({ token: jwt_token, email });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Middleware to verify JWT
export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export default router;
