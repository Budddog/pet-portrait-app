import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import fs from 'fs';
import axios from 'axios';
import { verifyToken } from './auth.js';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// File upload
const storage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads'),
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Store generations in memory (replace with database)
const generations = new Map();

// Upload and generate portrait
router.post('/generate', verifyToken, upload.single('petPhoto'), async (req, res) => {
  try {
    const { petName, petType, style } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Pet photo required' });
    }

    if (!petType || !['dog', 'cat', 'rabbit', 'bird', 'other'].includes(petType)) {
      return res.status(400).json({ error: 'Valid pet type required' });
    }

    const filePath = req.file.path;
    const fileBuffer = fs.readFileSync(filePath);
    const base64Image = fileBuffer.toString('base64');

    // First, analyze the uploaded image to understand what we're working with
    console.log('📸 Analyzing pet photo...');
    
    // Create Renaissance-style portrait with DALL-E 3
    const prompt = `Create a stunning Renaissance-style painted portrait of ${petType} ${petName || 'pet'} based on the provided image. 
    
Style guidelines:
- Renaissance oil painting style with classical technique
- Rich, warm color palette typical of 16th-17th century portraits
- Detailed brushwork and texture
- Pet as the main subject, positioned as a noble portrait subject
- Ornate background or elegant drapes
- Golden/amber lighting reminiscent of Renaissance masters
- High quality, museum-worthy appearance
- Realistic facial features with artistic interpretation
- Professional composition and framing

The painting should be a dignified, artistic interpretation of the pet as if commissioned by a Renaissance patron.`;

    console.log('🎨 Generating Renaissance portrait...');
    
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'hd'
    });

    const portraitUrl = response.data[0].url;

    // Download and save the generated image
    const portraitResponse = await axios.get(portraitUrl, { responseType: 'arraybuffer' });
    const portraitPath = path.join(__dirname, '../uploads/portrait-' + Date.now() + '.png');
    fs.writeFileSync(portraitPath, portraitResponse.data);

    const generationId = 'gen-' + Date.now();
    const generationData = {
      id: generationId,
      email: req.user.email,
      petName: petName || 'Unnamed Pet',
      petType,
      style: style || 'renaissance',
      uploadedImagePath: filePath,
      portraitUrl: portraitUrl,
      portraitPath: portraitPath,
      createdAt: new Date(),
      status: 'ready'
    };

    generations.set(generationId, generationData);

    // Clean up original upload
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      generationId,
      portraitUrl,
      petName: generationData.petName,
      petType
    });
  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ error: 'Failed to generate portrait: ' + error.message });
  }
});

// Get generation details
router.get('/:generationId', verifyToken, (req, res) => {
  try {
    const generation = generations.get(req.params.generationId);
    
    if (!generation) {
      return res.status(404).json({ error: 'Generation not found' });
    }

    if (generation.email !== req.user.email) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json(generation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch generation' });
  }
});

// List user's generations
router.get('/', verifyToken, (req, res) => {
  try {
    const userGenerations = Array.from(generations.values())
      .filter(g => g.email === req.user.email)
      .sort((a, b) => b.createdAt - a.createdAt);

    res.json(userGenerations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch generations' });
  }
});

export default router;
