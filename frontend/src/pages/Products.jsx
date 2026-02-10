import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { printifyAPI } from '../api';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const portraitUrl = localStorage.getItem('lastPortraitUrl');
  const petName = localStorage.getItem('lastPetName');
  const generationId = localStorage.getItem('lastGenerationId');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await printifyAPI.getProducts();
      setProducts(response.data);
    } catch (err) {
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProduct = (productType) => {
    localStorage.setItem('selectedProduct', productType);
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="content">
        <div className="loading">
          <div className="spinner"></div>
          Loading products...
        </div>
      </div>
    );
  }

  return (
    <div className="content">
      <h2>Your Renaissance Portrait</h2>
      
      {portraitUrl && (
        <div className="portrait-preview">
          <img src={portraitUrl} alt={`${petName}'s portrait`} />
          <p style={{ marginTop: '10px', color: '#666' }}>
            Beautiful portrait of <strong>{petName}</strong>
          </p>
        </div>
      )}

      <h3 style={{ marginTop: '40px', marginBottom: '20px' }}>Choose a Product</h3>
      
      {error && <div className="error">{error}</div>}

      <div className="products-grid">
        {products.map((product) => (
          <div key={product.id} className="product-card">
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <p style={{ fontSize: '0.85em', color: '#999', marginBottom: '15px' }}>
              Available sizes: {product.variants.map(v => v.title).join(', ')}
            </p>
            <p style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#8b5cf6', marginBottom: '15px' }}>
              $29.99
            </p>
            <button onClick={() => handleSelectProduct(product.id)}>
              Select {product.name}
            </button>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f0f7ff', borderRadius: '10px' }}>
        <h4 style={{ color: '#8b5cf6', marginBottom: '10px' }}>📦 What happens next?</h4>
        <ul style={{ marginLeft: '20px', color: '#555' }}>
          <li>Select a product to customize</li>
          <li>Choose your preferred size and variant</li>
          <li>Proceed to checkout with secure payment</li>
          <li>Receive order confirmation via email</li>
          <li>We'll print and ship your portrait within 5-7 business days</li>
        </ul>
      </div>
    </div>
  );
}
