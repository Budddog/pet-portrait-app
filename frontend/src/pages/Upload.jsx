import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { portraitAPI } from '../api';

export default function Upload() {
  const [petPhoto, setPetPhoto] = useState(null);
  const [petName, setPetName] = useState('');
  const [petType, setPetType] = useState('dog');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState('');
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPetPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!petPhoto) {
      setError('Please upload a pet photo');
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('petPhoto', petPhoto);
      formData.append('petName', petName || 'Pet');
      formData.append('petType', petType);

      const response = await portraitAPI.generate(formData);
      
      // Store generation ID for next step
      localStorage.setItem('lastGenerationId', response.data.generationId);
      localStorage.setItem('lastPortraitUrl', response.data.portraitUrl);
      localStorage.setItem('lastPetName', response.data.petName);

      navigate('/products');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate portrait');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content">
      <h2>Upload Your Pet Photo</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Upload a clear photo of your pet, and we'll create a beautiful Renaissance-style portrait
      </p>

      {error && <div className="error">{error}</div>}

      {preview && (
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <p style={{ color: '#666', marginBottom: '10px' }}>Photo preview:</p>
          <img src={preview} alt="Pet preview" style={{ maxWidth: '300px', maxHeight: '300px', borderRadius: '10px' }} />
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="photo">Pet Photo *</label>
          <input
            id="photo"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="name">Pet Name</label>
          <input
            id="name"
            type="text"
            value={petName}
            onChange={(e) => setPetName(e.target.value)}
            placeholder="e.g., Max, Whiskers, Fluffy"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="type">Pet Type *</label>
          <select
            id="type"
            value={petType}
            onChange={(e) => setPetType(e.target.value)}
            disabled={loading}
          >
            <option value="dog">Dog</option>
            <option value="cat">Cat</option>
            <option value="rabbit">Rabbit</option>
            <option value="bird">Bird</option>
            <option value="other">Other</option>
          </select>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? (
            <>
              <div className="spinner" style={{ display: 'inline-block', marginRight: '10px' }}></div>
              Generating Portrait...
            </>
          ) : (
            '✨ Generate Renaissance Portrait'
          )}
        </button>
      </form>

      <p style={{ marginTop: '20px', color: '#999', fontSize: '0.9em' }}>
        The AI will analyze your photo and create a stunning Renaissance-style painted portrait.
        This typically takes 30-60 seconds.
      </p>
    </div>
  );
}
