import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Verify from './pages/Verify';
import Upload from './pages/Upload';
import Products from './pages/Products';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import Orders from './pages/Orders';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    setIsAuthenticated(!!token);
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    setIsAuthenticated(false);
    navigate('/login');
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div>Loading...</div>;
  }

  return (
    <div className="container">
      <header>
        <h1>🎨 Pet Portrait</h1>
        <p className="subtitle">Renaissance-style painted portraits from your pet photos</p>
        {isAuthenticated && (
          <nav>
            <a href="/upload">Upload</a>
            <a href="/orders">My Orders</a>
            <button onClick={handleLogout}>Logout</button>
          </nav>
        )}
      </header>

      <Routes>
        <Route 
          path="/login" 
          element={!isAuthenticated ? <Login onSuccess={() => setIsAuthenticated(true)} /> : <Navigate to="/upload" />}
        />
        <Route 
          path="/verify" 
          element={<Verify onSuccess={() => setIsAuthenticated(true)} />}
        />
        <Route 
          path="/upload" 
          element={isAuthenticated ? <Upload /> : <Navigate to="/login" />}
        />
        <Route 
          path="/products" 
          element={isAuthenticated ? <Products /> : <Navigate to="/login" />}
        />
        <Route 
          path="/checkout" 
          element={isAuthenticated ? <Checkout /> : <Navigate to="/login" />}
        />
        <Route 
          path="/order-success" 
          element={<OrderSuccess />}
        />
        <Route 
          path="/orders" 
          element={isAuthenticated ? <Orders /> : <Navigate to="/login" />}
        />
        <Route 
          path="/" 
          element={isAuthenticated ? <Navigate to="/upload" /> : <Navigate to="/login" />}
        />
      </Routes>
    </div>
  );
}

export default App;
