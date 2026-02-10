import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { printifyAPI, paymentAPI } from '../api';

export default function Checkout() {
  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const productType = localStorage.getItem('selectedProduct');
  const portraitUrl = localStorage.getItem('lastPortraitUrl');
  const petName = localStorage.getItem('lastPetName');
  const generationId = localStorage.getItem('lastGenerationId');
  const navigate = useNavigate();

  useEffect(() => {
    if (!productType) {
      navigate('/products');
      return;
    }

    fetchProductDetails();
  }, [productType, navigate]);

  const fetchProductDetails = async () => {
    try {
      const response = await printifyAPI.getProductDetails(productType);
      setProduct(response.data);
      if (response.data.variants.length > 0) {
        setSelectedVariant(response.data.variants[0]);
      }
    } catch (err) {
      setError('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!selectedVariant) {
      setError('Please select a size');
      return;
    }

    setError('');
    setProcessing(true);

    try {
      const response = await paymentAPI.createCheckout({
        generationId,
        petName,
        productType,
        variant: selectedVariant.title,
        quantity: parseInt(quantity)
      });

      // Redirect to PayPal approval URL
      if (response.data.approvalUrl) {
        window.location.href = response.data.approvalUrl;
      } else {
        setError('Failed to create checkout session');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Checkout failed');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="content">
        <div className="loading">
          <div className="spinner"></div>
          Loading...
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="content">
        <div className="error">{error || 'Product not found'}</div>
        <button onClick={() => navigate('/products')}>Back to Products</button>
      </div>
    );
  }

  return (
    <div className="content">
      <h2>Order Summary</h2>

      {portraitUrl && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'start' }}>
          <div>
            <img src={portraitUrl} alt={`${petName}'s portrait`} style={{ maxWidth: '100%', borderRadius: '10px' }} />
          </div>

          <div>
            <h3 style={{ color: '#8b5cf6', marginBottom: '20px' }}>{product.name}</h3>
            <p style={{ color: '#666', marginBottom: '20px' }}>{product.description}</p>

            {error && <div className="error">{error}</div>}

            <div className="form-group">
              <label htmlFor="size">Size/Variant</label>
              <select
                id="size"
                value={selectedVariant?.sku || ''}
                onChange={(e) => {
                  const variant = product.variants.find(v => v.sku === e.target.value);
                  setSelectedVariant(variant);
                }}
                disabled={processing}
              >
                {product.variants.map((variant) => (
                  <option key={variant.sku} value={variant.sku}>
                    {variant.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="quantity">Quantity</label>
              <input
                id="quantity"
                type="number"
                min="1"
                max="10"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                disabled={processing}
              />
            </div>

            <div style={{ padding: '15px', backgroundColor: '#f0f7ff', borderRadius: '10px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span>Unit Price:</span>
                <strong>$29.99</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e0e0e0', paddingTop: '10px', fontSize: '1.1em' }}>
                <span>Total:</span>
                <strong>${(29.99 * quantity).toFixed(2)}</strong>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={processing}
              style={{ width: '100%', padding: '15px', fontSize: '1.1em' }}
            >
              {processing ? 'Processing...' : '💳 Proceed to Payment'}
            </button>

            <p style={{ marginTop: '15px', fontSize: '0.85em', color: '#999', textAlign: 'center' }}>
              Secure payment via PayPal • Ships within 5-7 business days
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
