import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getDatabase, ref, update, onValue } from 'firebase/database';
import StatusStepper from '../Status/StatusStepper';

const DonationCard = ({ donation }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentData, setCurrentData] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!donation?.id) return;
    const db = getDatabase();
    const donationRef = ref(db, `donationRequests/${donation.id}`);
    return onValue(donationRef, (snapshot) => {
      setCurrentData(snapshot.val());
    });
  }, [donation.id]);

  const handleClaim = () => {
    if (!currentUser || !donation.id) return;
    const db = getDatabase();
    const donationRef = ref(db, `donationRequests/${donation.id}`);
    update(donationRef, {
      status: 'claimed',
      claimedBy: currentUser.uid,
    });
  };

  const isOwner = currentUser && currentUser.uid === donation.createdBy;
  const status = currentData?.status || donation.status;
  const isAvailable = status === 'available';

  return (
    <div className="card mb-4 shadow-sm border">
      <div className="card-body">
        <h5 className="card-title">{donation.title}</h5>
        <p className="text-muted">{donation.description}</p>

        <ul className="list-unstyled mb-3">
          <li><strong>Post Type:</strong> {donation.postType || 'donation'}</li>
          <li><strong>Food:</strong> {donation.foodType}</li>
          <li><strong>Quantity:</strong> {donation.foodQuantity}</li>
          <li><strong>Weight:</strong> {donation.foodWeight} kg</li>
          {donation.expirationDate && (
            <li><strong>Expires:</strong> {donation.expirationDate}</li>
          )}
          {donation.pickupDateTime && (
            <li><strong>Pickup Time:</strong> {donation.pickupDateTime}</li>
          )}
          <li><strong>Status:</strong> <span className="badge bg-secondary">{status}</span></li>
        </ul>

        <StatusStepper status={status} />

        <p className="mt-2 text-muted small">
          Posted by: <em>{isOwner ? 'You' : donation.createdBy}</em>
        </p>

        {/* Only show claim button if not owner and status is available */}
        {!isOwner && isAvailable && (
          <button className="btn btn-warning btn-sm mt-2" onClick={handleClaim}>
            Claim
          </button>
        )}
      </div>
    </div>
  );
};

export default DonationCard;
