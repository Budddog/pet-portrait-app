import { useState, useEffect } from 'react';
import { paymentAPI } from '../api';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await paymentAPI.getOrders();
      setOrders(response.data);
    } catch (err) {
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="content">
        <div className="loading">
          <div className="spinner"></div>
          Loading your orders...
        </div>
      </div>
    );
  }

  return (
    <div className="content">
      <h2>📦 My Orders</h2>

      {error && <div className="error">{error}</div>}

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          <p>You haven't placed any orders yet.</p>
          <p style={{ marginTop: '10px' }}>
            <a href="/upload" style={{ color: '#8b5cf6', textDecoration: 'underline' }}>
              Create your first pet portrait
            </a>
          </p>
        </div>
      ) : (
        <div>
          {orders.map((order) => (
            <div key={order.id} className="order-status" style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <h4 style={{ marginBottom: '10px' }}>
                    {order.metadata?.petName}'s {order.metadata?.productType}
                  </h4>
                  <p><strong>Order ID:</strong> {order.id}</p>
                  <p><strong>Product:</strong> {order.metadata?.productType}</p>
                  <p><strong>Amount:</strong> ${(order.amount / 100).toFixed(2)}</p>
                  <p><strong>Ordered:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                  <p>
                    <strong>Status:</strong>{' '}
                    <span style={{
                      display: 'inline-block',
                      padding: '5px 10px',
                      borderRadius: '20px',
                      backgroundColor: '#d4edda',
                      color: '#155724',
                      fontSize: '0.9em',
                      marginLeft: '10px'
                    }}>
                      {order.status.toUpperCase()}
                    </span>
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ color: '#999', fontSize: '0.9em' }}>Shipping in</p>
                  <p style={{ color: '#8b5cf6', fontSize: '1.1em', fontWeight: 'bold' }}>5-7 days</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#fff9e6', borderRadius: '10px', borderLeft: '4px solid #ffc107' }}>
        <h4 style={{ marginBottom: '10px', color: '#856404' }}>ℹ️ About Your Order</h4>
        <ul style={{ marginLeft: '20px', color: '#555', fontSize: '0.9em' }}>
          <li>Orders are printed and shipped within 5-7 business days</li>
          <li>You'll receive an email with tracking information once shipped</li>
          <li>For questions about your order, check your email for support contact</li>
          <li>All prints use museum-quality inks and materials</li>
        </ul>
      </div>
    </div>
  );
}
