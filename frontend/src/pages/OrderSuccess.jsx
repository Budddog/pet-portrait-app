import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { paymentAPI } from '../api';

export default function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      // This is a PayPal return - capture the order
      capturePayPalOrder(token);
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  const capturePayPalOrder = async (orderId) => {
    try {
      const response = await paymentAPI.captureOrder(orderId);
      if (response.data.success) {
        // Fetch the captured order details
        const orderResponse = await paymentAPI.getOrder(response.data.orderId);
        setOrder(orderResponse.data);
      } else {
        setError(response.data.message || 'Failed to capture payment');
      }
    } catch (err) {
      console.error('Failed to capture order:', err);
      setError(err.response?.data?.error || 'Payment capture failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="content">
        <div className="loading">
          <div className="spinner"></div>
          Processing your payment...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="content">
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#dc3545', marginBottom: '20px' }}>❌ Payment Error</h2>
          <p style={{ fontSize: '1.1em', color: '#666', marginBottom: '30px' }}>
            {error}
          </p>
          <button onClick={() => navigate('/checkout')}>
            ← Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="content">
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ color: '#28a745', marginBottom: '20px' }}>✅ Order Confirmed!</h2>
        <p style={{ fontSize: '1.1em', color: '#666', marginBottom: '30px' }}>
          Thank you for your purchase! Your Renaissance pet portrait is on its way.
        </p>

        {order && (
          <div className="order-status">
            <h4>Order Details</h4>
            <div style={{ textAlign: 'left', marginTop: '15px' }}>
              <p><strong>Order ID:</strong> {order.id}</p>
              <p><strong>Amount:</strong> ${order.amount}</p>
              <p><strong>Status:</strong> {order.status}</p>
              {order.metadata && (
                <>
                  <p><strong>Product:</strong> {order.metadata.productType}</p>
                  <p><strong>Pet:</strong> {order.metadata.petName}</p>
                </>
              )}
            </div>
          </div>
        )}

        <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f0f7ff', borderRadius: '10px' }}>
          <h4 style={{ color: '#8b5cf6', marginBottom: '15px' }}>📧 What's Next?</h4>
          <ul style={{ textAlign: 'left', marginLeft: '20px', color: '#555' }}>
            <li>Check your email for order confirmation</li>
            <li>Your portrait will be printed on your selected product</li>
            <li>We'll send tracking information once it ships (5-7 business days)</li>
            <li>Visit "My Orders" to track your order status</li>
          </ul>
        </div>

        <div style={{ marginTop: '30px' }}>
          <button onClick={() => navigate('/upload')} style={{ marginRight: '10px' }}>
            ✨ Create Another Portrait
          </button>
          <button onClick={() => navigate('/orders')} style={{ background: '#666' }}>
            📦 View My Orders
          </button>
        </div>
      </div>
    </div>
  );
}
