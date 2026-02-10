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
      await authAPI.login(email);
      setMessage('✅ Check your email for the login link!');
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send login email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content auth-form">
      <h2>Welcome to Pet Portrait</h2>
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
          {loading ? 'Sending...' : 'Send Login Link'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9em', color: '#666' }}>
        We'll send you a secure login link. No password needed!
      </p>
    </div>
  );
}
