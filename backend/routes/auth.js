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

// Send magic link login
router.post('/login', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email required' });
    }

    // Check env vars
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error('Missing EMAIL_USER or EMAIL_PASSWORD');
      return res.status(500).json({ error: 'Email service not configured' });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes
    
    emailTokens.set(token, { email, expiresAt });

    // Send email
    const baseUrl = process.env.FRONTEND_URL || 'https://skillful-prosperity-production.up.railway.app';
    const loginLink = `${baseUrl}/verify?token=${token}`;
    
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: '🎨 Your Pet Portrait Login Link',
      html: `
        <h2>Your Login Link</h2>
        <p>Click the link below to access your pet portrait app:</p>
        <a href="${loginLink}" style="padding: 10px 20px; background: #8b5cf6; color: white; text-decoration: none; border-radius: 5px;">
          Login to Pet Portrait
        </a>
        <p>This link expires in 15 minutes.</p>
      `
    });

    res.json({ message: 'Login link sent to email', email });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: 'Failed to send login email: ' + error.message });
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
