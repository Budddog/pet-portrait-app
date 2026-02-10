import { useState } from 'react';
import { authAPI } from '../api';

export default function Login({ onSuccess }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await authAPI.login(email);
      if (response.token) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('email', email);
        setMessage('✅ Login successful!');
        if (onSuccess) onSuccess();
      }
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content auth-form">
      <h2>🎨 Pet Portrait</h2>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '20px' }}>
        Generate stunning Renaissance-style portraits of your beloved pets
      </p>

      {message && <div className="success">{message}</div>}
      {error && <div className="error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Your Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            disabled={loading}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9em', color: '#666' }}>
        Enter any email to access your pet portraits
      </p>
    </div>
  );
}
