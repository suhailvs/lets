import { useState } from 'react';
import Listings from '../components/Listings';

export default function AllListings() {
  const [tab, setTab] = useState('O');

  return (
    <div>
      <div className="d-flex gap-2 mb-3">
        <button
          className={`btn btn-outline-primary ${tab === 'O' ? 'active' : ''}`}
          type="button"
          onClick={() => setTab('O')}
        >
          Offerings
        </button>
        <button
          className={`btn btn-outline-primary ${tab === 'W' ? 'active' : ''}`}
          type="button"
          onClick={() => setTab('W')}
        >
          Wants
        </button>
      </div>
      <Listings listingType={tab} userId="all" showAddButton={false} />
    </div>
  );
}
