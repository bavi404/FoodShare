import React, { useEffect, useState } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import FeedMap from './FeedMap';
import DonationCard from './DonationCard';
import Filters from './Filters';

const PublicFeed = () => {
  const [donations, setDonations] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [filterType, setFilterType] = useState('');
  const [postTypeFilter, setPostTypeFilter] = useState('');
  const [expirySoon, setExpirySoon] = useState(false);
  const [distanceRange, setDistanceRange] = useState(0); // 0 = all

  // Mock location (e.g., Bangalore center)
  const USER_LAT = 12.9716;
  const USER_LNG = 77.5946;

  const getDistanceKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    const db = getDatabase();
    const donationRef = ref(db, 'donationRequests');
  
    onValue(donationRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Auto-expire logic
        Object.entries(data).forEach(([id, val]) => {
          const expDate = new Date(val.expirationDate);
          const today = new Date();
  
          if (
            val.status !== 'picked-up' &&
            val.status !== 'expired' &&
            expDate < today
          ) {
            update(ref(db, `donationRequests/${id}`), { status: 'expired' });
          }
        });
  
        const list = Object.entries(data)
          .map(([id, val]) => ({ id, ...val }))
          .filter((d) =>
            d.status === 'available' ||
            d.status === 'claimed' ||
            d.status === 'approved'
          );
  
        setDonations(list);
        setFiltered(list);
      }
    });
  }, []);
  

  useEffect(() => {
    let filteredList = [...donations];

    if (filterType) {
      filteredList = filteredList.filter(
        (d) => d.foodType?.toLowerCase() === filterType.toLowerCase()
      );
    }

    if (postTypeFilter) {
      filteredList = filteredList.filter(
        (d) => d.postType?.toLowerCase() === postTypeFilter.toLowerCase()
      );
    }

    if (expirySoon) {
      const today = new Date();
      const soon = new Date();
      soon.setDate(today.getDate() + 2);

      filteredList = filteredList.filter((d) => {
        if (!d.expirationDate) return false;
        const exp = new Date(d.expirationDate);
        return exp <= soon;
      });
    }

    if (distanceRange > 0) {
      filteredList = filteredList.filter((d) => {
        const loc = d.location;
        if (!loc || !loc.lat || !loc.lng) return false;
        const distance = getDistanceKm(USER_LAT, USER_LNG, loc.lat, loc.lng);
        return distance <= distanceRange;
      });
    }

    setFiltered(filteredList);
  }, [filterType, postTypeFilter, expirySoon, distanceRange, donations]);

  return (
    <div className="container mt-4">
      <h2 className="mb-3">🍱 Available Donations & Requests</h2>

      <Filters
        filterType={filterType}
        setFilterType={setFilterType}
        postTypeFilter={postTypeFilter}
        setPostTypeFilter={setPostTypeFilter}
        expirySoon={expirySoon}
        setExpirySoon={setExpirySoon}
        distanceRange={distanceRange}
        setDistanceRange={setDistanceRange}
      />

      <div className="row">
        <div className="col-md-6">
          {filtered.length === 0 ? (
            <p>No posts match your filters.</p>
          ) : (
            filtered.map((donation) => (
              <DonationCard key={donation.id} donation={donation} />
            ))
          )}
        </div>
        <div className="col-md-6">
          <FeedMap donations={filtered} />
        </div>
      </div>
    </div>
  );
};

export default PublicFeed;
