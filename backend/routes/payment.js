import express from 'express';
import axios from 'axios';
import { verifyToken } from './auth.js';
import nodemailer from 'nodemailer';

const router = express.Router();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Orders storage (replace with database)
const orders = new Map();

// PayPal configuration
const PAYPAL_API_BASE = process.env.PAYPAL_API_URL || 'https://api.sandbox.paypal.com';
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

// Get PayPal access token
async function getPayPalAccessToken() {
  try {
    const response = await axios.post(
      `${PAYPAL_API_BASE}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        auth: {
          username: PAYPAL_CLIENT_ID,
          password: PAYPAL_CLIENT_SECRET
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error('PayPal token error:', error.response?.data || error.message);
    throw new Error('Failed to get PayPal access token');
  }
}

// Create PayPal order
router.post('/checkout', verifyToken, async (req, res) => {
  try {
    const { generationId, petName, productType, variant, quantity = 1 } = req.body;
    
    const accessToken = await getPayPalAccessToken();
    const amount = '29.99'; // $29.99 per item

    const paypalOrderData = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'USD',
            value: amount,
            breakdown: {
              item_total: {
                currency_code: 'USD',
                value: amount
              }
            }
          },
          items: [
            {
              name: `${petName} - ${productType}`,
              description: `${variant} - Renaissance-style pet portrait`,
              sku: `portrait-${productType}-${variant}`,
              unit_amount: {
                currency_code: 'USD',
                value: amount
              },
              quantity: String(quantity),
              category: 'PHYSICAL_GOODS'
            }
          ],
          custom_id: generationId,
          description: `Pet Portrait Order - ${petName}`
        }
      ],
      application_context: {
        brand_name: 'Pet Portrait Studio',
        locale: 'en-US',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW',
        return_url: `${process.env.FRONTEND_URL}/order-success`,
        cancel_url: `${process.env.FRONTEND_URL}/products`
      }
    };

    const response = await axios.post(
      `${PAYPAL_API_BASE}/v2/checkout/orders`,
      paypalOrderData,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    const paypalOrder = response.data;
    
    // Store order metadata
    orders.set(paypalOrder.id, {
      id: paypalOrder.id,
      email: req.user.email,
      metadata: {
        generationId,
        petName,
        productType,
        variant,
        quantity
      },
      status: 'pending',
      createdAt: new Date()
    });

    // Find the approval link
    const approvalLink = paypalOrder.links.find(link => link.rel === 'approve');

    res.json({
      orderId: paypalOrder.id,
      approvalUrl: approvalLink.href
    });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ 
      error: 'Failed to create checkout session: ' + error.message 
    });
  }
});

// Capture PayPal order (called after user approves on PayPal)
router.post('/capture/:orderId', verifyToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Verify the order belongs to the user
    const storedOrder = orders.get(orderId);
    if (!storedOrder || storedOrder.email !== req.user.email) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const accessToken = await getPayPalAccessToken();

    const captureResponse = await axios.post(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    const capturedOrder = captureResponse.data;

    if (capturedOrder.status === 'COMPLETED') {
      // Update order status
      const order = {
        id: 'order-' + Date.now(),
        paypalOrderId: orderId,
        email: req.user.email,
        metadata: storedOrder.metadata,
        amount: capturedOrder.purchase_units[0].amount.value,
        status: 'paid',
        createdAt: new Date(),
        printifyStatus: 'pending'
      };

      orders.set(order.id, order);

      // Send confirmation email
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: req.user.email,
        subject: '🎉 Order Confirmation - Pet Portrait',
        html: `
          <h2>Order Confirmed!</h2>
          <p>Your pet portrait ${order.metadata.productType} order has been received and paid.</p>
          <p><strong>Order ID:</strong> ${order.id}</p>
          <p><strong>PayPal Transaction ID:</strong> ${orderId}</p>
          <p><strong>Pet Name:</strong> ${order.metadata.petName}</p>
          <p><strong>Amount:</strong> $${order.amount}</p>
          <p>We'll print and ship your Renaissance-style portrait soon!</p>
          <p>Track your order: ${process.env.FRONTEND_URL}/orders/${order.id}</p>
        `
      });

      console.log(`✅ Order captured: ${order.id}`);

      res.json({
        success: true,
        orderId: order.id,
        message: 'Payment captured successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: `Order capture failed with status: ${capturedOrder.status}`
      });
    }
  } catch (error) {
    console.error('Capture error:', error);
    res.status(500).json({ 
      error: 'Failed to capture payment: ' + error.message 
    });
  }
});

// Get order details
router.get('/orders/:orderId', verifyToken, (req, res) => {
  try {
    const order = orders.get(req.params.orderId);
    
    if (!order || order.email !== req.user.email) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Get user orders
router.get('/orders', verifyToken, (req, res) => {
  try {
    const userOrders = Array.from(orders.values())
      .filter(o => o.email === req.user.email)
      .sort((a, b) => b.createdAt - a.createdAt);

    res.json(userOrders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

export default router;
