import express from 'express';
import axios from 'axios';
import { verifyToken } from './auth.js';

const router = express.Router();

const printifyAPI = axios.create({
  baseURL: 'https://api.printify.com/v1',
  headers: {
    'Authorization': `Bearer ${process.env.PRINTIFY_API_KEY}`
  }
});

// Product templates (simplified)
const productTemplates = {
  'canvas-print': {
    name: 'Canvas Print',
    description: 'High-quality canvas print of your pet portrait',
    variants: [
      { id: 1, title: '8x10', sku: 'canvas-8x10' },
      { id: 2, title: '11x14', sku: 'canvas-11x14' },
      { id: 3, title: '16x20', sku: 'canvas-16x20' }
    ]
  },
  'framed-print': {
    name: 'Framed Print',
    description: 'Elegant framed portrait print',
    variants: [
      { id: 1, title: '8x10', sku: 'framed-8x10' },
      { id: 2, title: '11x14', sku: 'framed-11x14' }
    ]
  },
  'poster': {
    name: 'Poster Print',
    description: 'Beautiful poster of your pet portrait',
    variants: [
      { id: 1, title: '12x18', sku: 'poster-12x18' },
      { id: 2, title: '18x24', sku: 'poster-18x24' }
    ]
  },
  'mug': {
    name: 'Coffee Mug',
    description: 'Ceramic mug with pet portrait',
    variants: [
      { id: 1, title: '11oz', sku: 'mug-11oz' }
    ]
  },
  'tshirt': {
    name: 'T-Shirt',
    description: 'High-quality t-shirt with pet portrait',
    variants: [
      { id: 1, title: 'S', sku: 'tshirt-s' },
      { id: 2, title: 'M', sku: 'tshirt-m' },
      { id: 3, title: 'L', sku: 'tshirt-l' },
      { id: 4, title: 'XL', sku: 'tshirt-xl' }
    ]
  }
};

// Get available products
router.get('/products', verifyToken, (req, res) => {
  try {
    const products = Object.entries(productTemplates).map(([key, product]) => ({
      id: key,
      ...product
    }));
    res.json(products);
  } catch (error) {
    console.error('Products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Create product in Printify
router.post('/create-product', verifyToken, async (req, res) => {
  try {
    const { generationId, portraitUrl, productType, petName } = req.body;

    if (!productType || !productTemplates[productType]) {
      return res.status(400).json({ error: 'Invalid product type' });
    }

    const template = productTemplates[productType];

    // Create product via Printify API
    const productPayload = {
      title: `${petName} - Renaissance Portrait (${template.name})`,
      description: template.description,
      images: [
        {
          src: portraitUrl,
          position: 'front'
        }
      ],
      variants: template.variants.map(variant => ({
        title: variant.title,
        sku: variant.sku,
        price: 2999, // $29.99 in cents
        cost: 999    // $9.99 cost
      }))
    };

    // Note: Real Printify API requires actual shop_id and more detailed setup
    // For MVP, we'll simulate this
    const productId = 'prod-' + Date.now();

    const createdProduct = {
      id: productId,
      ...productPayload,
      createdAt: new Date(),
      shopId: process.env.PRINTIFY_SHOP_ID || 'shop-demo'
    };

    res.json({
      success: true,
      productId,
      product: createdProduct
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product: ' + error.message });
  }
});

// Get product variants with pricing
router.get('/product/:productType', verifyToken, (req, res) => {
  try {
    const { productType } = req.params;
    const template = productTemplates[productType];

    if (!template) {
      return res.status(404).json({ error: 'Product type not found' });
    }

    res.json({
      type: productType,
      ...template,
      variants: template.variants.map(v => ({
        ...v,
        price: '$29.99',
        shippingEstimate: '5-7 business days'
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product details' });
  }
});

export default router;
