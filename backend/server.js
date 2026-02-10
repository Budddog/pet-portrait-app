import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Routes - Import them
import authRoutes from './routes/auth.js';
import portraitRoutes from './routes/portrait.js';
import printifyRoutes from './routes/printify.js';
import paymentRoutes from './routes/payment.js';

app.use('/api/auth', authRoutes);
app.use('/api/portrait', portraitRoutes);
app.use('/api/printify', printifyRoutes);
app.use('/api/payment', paymentRoutes);

// Serve static frontend files in production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(frontendPath));
  
  // SPA fallback
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// Debug endpoint - check if env vars are loaded
app.get('/api/debug/env', (req, res) => {
  res.json({
    EMAIL_USER: process.env.EMAIL_USER ? '✅ SET' : '❌ MISSING',
    EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ? '✅ SET' : '❌ MISSING',
    JWT_SECRET: process.env.JWT_SECRET ? '✅ SET' : '❌ MISSING',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '✅ SET' : '❌ MISSING',
    NODE_ENV: process.env.NODE_ENV
  });
});

// Health check (before static serving in production)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🎨 Pet Portrait Backend running on port ${PORT}`);
  console.log(`✅ Email service: ${process.env.EMAIL_USER ? 'ACTIVE' : 'INACTIVE'}`);
});

export { upload };
