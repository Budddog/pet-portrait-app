import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../api';

export default function Verify({ onSuccess }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setError('No verification token found');
        setLoading(false);
        return;
      }

      try {
        const response = await authAPI.verify(token);
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('userEmail', response.data.email);
        onSuccess();
        navigate('/upload');
      } catch (err) {
        setError(err.response?.data?.error || 'Verification failed');
        setLoading(false);
      }
    };

    verifyToken();
  }, [searchParams, navigate, onSuccess]);

  if (loading) {
    return (
      <div className="content" style={{ textAlign: 'center' }}>
        <div className="spinner"></div>
        <p>Verifying your email...</p>
      </div>
    );
  }

  return (
    <div className="content" style={{ textAlign: 'center' }}>
      {error && (
        <>
          <div className="error">{error}</div>
          <p>
            <a href="/login">Back to login</a>
          </p>
        </>
      )}
    </div>
  );
}
