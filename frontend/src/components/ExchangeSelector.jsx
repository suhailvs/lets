import { useEffect, useState } from 'react';
import API from '../utils/api';

export default function ExchangeSelector({ onExchangeSelected }) {
  const [activeTab, setActiveTab] = useState('join');
  const [exchanges, setExchanges] = useState([]);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [selectedExchange, setSelectedExchange] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [createForm, setCreateForm] = useState({
    exchange_code: '',
    exchange_name: '',
    exchange_address: '',
    exchange_postal_code: '',
  });

  useEffect(() => {
    fetchExchanges();
    fetchCountries();
  }, []);

  const createPayload = (form, stateCode = selectedState) => ({
    mode: 'create',
    ...form,
    exchange_country_city: stateCode,
  });

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'join') {
      onExchangeSelected({ mode: 'join', exchange: selectedExchange });
      return;
    }
    onExchangeSelected(createPayload(createForm));
  };

  const handleJoinExchangeChange = (value) => {
    setSelectedExchange(value);
    onExchangeSelected({ mode: 'join', exchange: value });
  };

  const handleCreateFieldChange = (field, value) => {
    const next = { ...createForm, [field]: value };
    setCreateForm(next);
    onExchangeSelected(createPayload(next));
  };

  const handleCountryChange = async (countryCode) => {
    setSelectedCountry(countryCode);
    setSelectedState('');
    onExchangeSelected(createPayload(createForm, ''));
    if (!countryCode) {
      setStates([]);
      return;
    }
    try {
      const response = await API.get(`/ajax/?purpose=states&country=${countryCode}`);
      setStates(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching states:', error);
      setStates([]);
    }
  };

  const handleStateChange = (stateCode) => {
    setSelectedState(stateCode);
    onExchangeSelected({
      ...createPayload(createForm),
      exchange_country_city: stateCode,
    });
  };

  const fetchExchanges = async () => {
    try {
      const response = await API.get('/ajax/?purpose=exchanges');
      setExchanges(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching exchanges:', error);
    }
  };

  const fetchCountries = async () => {
    try {
      const response = await API.get('/ajax/?purpose=countries');
      setCountries(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching countries:', error);
      setCountries([]);
    }
  };

  return (
    <div className="mb-4">
      <div className="btn-group" role="group" aria-label="Exchange selector">
        <button
          type="button"
          className={`btn btn-outline-primary ${activeTab === 'join' ? 'active' : ''}`}
          onClick={() => handleTabChange('join')}
        >
          Join Exchange
        </button>
        <button
          type="button"
          className={`btn btn-outline-primary ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => handleTabChange('create')}
        >
          Create New Exchange
        </button>
      </div>

      <div className="border rounded p-3 mt-3">
        {activeTab === 'join' && (
          <div>
            <label className="form-label">Select Exchange</label>
            <select
              className="form-select"
              value={selectedExchange}
              onChange={(e) => handleJoinExchangeChange(e.target.value)}
            >
              <option value="">Select an Exchange</option>
              {exchanges.map((item) => (
                <option key={item[0]} value={item[0]}>
                  {item[1]}
                </option>
              ))}
            </select>
          </div>
        )}

        {activeTab === 'create' && (
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Exchange Code (4 chars)</label>
              <input
                className="form-control"
                value={createForm.exchange_code}
                onChange={(e) => handleCreateFieldChange('exchange_code', e.target.value)}
                placeholder="EXCH"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Exchange Name</label>
              <input
                className="form-control"
                value={createForm.exchange_name}
                onChange={(e) => handleCreateFieldChange('exchange_name', e.target.value)}
                placeholder="Neighborhood Exchange"
              />
            </div>
            <div className="col-12">
              <label className="form-label">Address</label>
              <input
                className="form-control"
                value={createForm.exchange_address}
                onChange={(e) => handleCreateFieldChange('exchange_address', e.target.value)}
                placeholder="Street, City"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Country</label>
              <select
                className="form-select"
                value={selectedCountry}
                onChange={(e) => handleCountryChange(e.target.value)}
              >
                <option value="">Select Country</option>
                {countries.map((item) => (
                  <option key={item[0]} value={item[0]}>
                    {item[1]}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label">State</label>
              <select
                className="form-select"
                value={selectedState}
                onChange={(e) => handleStateChange(e.target.value)}
                disabled={!selectedCountry}
              >
                <option value="">Select State</option>
                {states.map((item) => (
                  <option key={item[0]} value={item[0]}>
                    {item[1]}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label">Postal Code</label>
              <input
                className="form-control"
                value={createForm.exchange_postal_code}
                onChange={(e) => handleCreateFieldChange('exchange_postal_code', e.target.value)}
                placeholder="Postal Code"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
