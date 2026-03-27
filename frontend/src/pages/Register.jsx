import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import ExchangeSelector from '../components/ExchangeSelector';
import ImagePicker from '../components/ImagePicker';

export default function Register() {
  const navigate = useNavigate();
  const [exchangeData, setExchangeData] = useState({ mode: 'join', exchange: '' });
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    const joinInvalid = exchangeData.mode === 'join' && !exchangeData.exchange;
    const createInvalid =
      exchangeData.mode === 'create' &&
      (!exchangeData.exchange_code ||
        !exchangeData.exchange_name ||
        !exchangeData.exchange_address ||
        !exchangeData.exchange_country_city);

    if (!firstName || !email || !phone || !password || joinInvalid || createInvalid || !image) {
      if (!image) {
        setError('Please upload your profile picture.');
      } else if (joinInvalid || createInvalid) {
        setError('Please complete exchange details.');
      } else {
        setError('Please fill all fields.');
      }
      return;
    }

    setError('');
    setLoading(true);

    const formData = new FormData();
    formData.append('image', image);
    formData.append('first_name', firstName);
    formData.append('email', email);
    formData.append('phone', phone);
    formData.append('password', password);

    if (exchangeData.mode === 'join') {
      formData.append('exchange', exchangeData.exchange);
    } else {
      formData.append('exchange_code', exchangeData.exchange_code.toUpperCase());
      formData.append('exchange_name', exchangeData.exchange_name);
      formData.append('exchange_address', exchangeData.exchange_address);
      formData.append('exchange_country_city', exchangeData.exchange_country_city.toUpperCase());
      formData.append('exchange_postal_code', exchangeData.exchange_postal_code || '');
    }

    try {
      const response = await API.post('/registration/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const username = response.data?.username || '';
      const isActive = response.data?.is_active ? 'true' : 'false';
      navigate(`/inactive?username=${encodeURIComponent(username)}&is_active=${isActive}`);
    } catch (err) {
      console.error('Registration error:', err);
      setError(JSON.stringify(err.response?.data) || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-lg-8">
        <div className="card">
          <div className="card-body">
            <h3 className="card-title">Create Your Account</h3>
            <form onSubmit={handleSubmit}>
              <ExchangeSelector onExchangeSelected={setExchangeData} />
              <div className="mb-3">
                <label className="form-label">First Name</label>
                <input className="form-control" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input className="form-control" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="mb-3">
                <label className="form-label">Phone (WhatsApp)</label>
                <input className="form-control" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="mb-3">
                <label className="form-label">Password</label>
                <input className="form-control" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <ImagePicker label="Profile Picture" onImageSelected={setImage} />
              {error && <div className="alert alert-danger">{error}</div>}
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? 'Signing Up...' : 'Sign Up'}
              </button>
              <div className="mt-3">
                <button type="button" className="btn btn-link p-0" onClick={() => navigate('/login')}>
                  Already a user? Login
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
