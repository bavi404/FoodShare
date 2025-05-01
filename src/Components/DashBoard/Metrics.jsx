import React, { useEffect, useState } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import '../css/metrics.css'; 

const Metrics = () => {
  const [volunteers, setVolunteers] = useState(0);
  const [donors, setDonors] = useState(0);
  const [quantitySum, setQuantitySum] = useState(0);
  const [weightSum, setWeightSum] = useState(0);

  useEffect(() => {
    const db = getDatabase();

    onValue(ref(db, 'donationRequests'), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const totalQuantity = Object.values(data).reduce((sum, req) => sum + (parseFloat(req.foodQuantity) || 0), 0);
        const totalWeight = Object.values(data).reduce((sum, req) => sum + (parseFloat(req.foodWeight) || 0), 0);
        setQuantitySum(totalQuantity);
        setWeightSum(totalWeight);
      }
    });

    onValue(ref(db, 'users'), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setVolunteers(Object.values(data).filter(u => u.account_type === 'volunteer').length);
        setDonors(Object.values(data).filter(u => u.account_type === 'donor').length);
      }
    });
  }, []);

  return (
    <div className="metrics-container row text-center g-3">
      <div className="col-md-3">
        <div className="metric-card shadow-sm p-3 bg-white rounded">
          <h6>Items Donated</h6>
          <h2>{quantitySum}+</h2>
        </div>
      </div>
      <div className="col-md-3">
        <div className="metric-card shadow-sm p-3 bg-white rounded">
          <h6>Meals Provided</h6>
          <h2>{weightSum} Kg</h2>
        </div>
      </div>
      <div className="col-md-3">
        <div className="metric-card shadow-sm p-3 bg-white rounded">
          <h6>Volunteers</h6>
          <h2>{volunteers}+</h2>
        </div>
      </div>
      <div className="col-md-3">
        <div className="metric-card shadow-sm p-3 bg-white rounded">
          <h6>Donors</h6>
          <h2>{donors}+</h2>
        </div>
      </div>
    </div>
  );
};

export default Metrics;
