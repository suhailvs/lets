import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import ImagePicker from '../components/ImagePicker';

export default function NewListing() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const listingType = params.get('type') || 'O';

  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rate, setRate] = useState('');
  const [image, setImage] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await API.get('/ajax/?purpose=categories');
      setCategories(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!category || !title || !description || !rate) {
      setError('Please fill all fields.');
      return;
    }
    if (!image) {
      setError('Please upload an image.');
      return;
    }
    setError('');
    setLoading(true);

    const formData = new FormData();
    formData.append('image', image);
    formData.append('category', category);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('rate', rate);
    formData.append('listing_type', listingType);

    try {
      await API.post('/listings/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      navigate('/dashboard');
    } catch (err) {
      console.error('Error creating listing:', err);
      setError('Unable to create listing.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="row">
      <div className="col-lg-8">
        <div className="card">
          <div className="card-body">
            <h4 className="card-title">Add New {listingType === 'O' ? 'Offering' : 'Want'}</h4>
            <form onSubmit={handleSubmit}>
              <ImagePicker label="Listing Image" onImageSelected={setImage} />
              <div className="mb-3">
                <label className="form-label">Category</label>
                <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="">Select a Category</option>
                  {categories.map((item) => (
                    <option key={item[0]} value={item[0]}>
                      {item[1]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Title</label>
                <input className="form-control" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="mb-3">
                <label className="form-label">Description</label>
                <textarea className="form-control" rows="4" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="mb-3">
                <label className="form-label">Rate (ℏ)</label>
                <input className="form-control" value={rate} onChange={(e) => setRate(e.target.value)} />
              </div>
              {error && <div className="alert alert-danger">{error}</div>}
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Add Listing'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
