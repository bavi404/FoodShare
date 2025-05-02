import React, { useState, useEffect } from 'react';
import { getDatabase, ref, update, onValue } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const ClaimFlowButtons = ({ donationId }) => {
  const [donation, setDonation] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [rating, setRating] = useState(5);
  const [showRate, setShowRate] = useState(false);
  const [comment, setComment] = useState('');

  const db = getDatabase();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) setCurrentUserId(user.uid);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const donationRef = ref(db, `donationRequests/${donationId}`);
    onValue(donationRef, (snapshot) => {
      setDonation(snapshot.val());
    });
  }, [donationId]);

  const handleClaim = () => {
    update(ref(db, `donationRequests/${donationId}`), {
      status: 'claimed',
      claimedBy: currentUserId,
    });
  };

  const handleApprove = () => {
    update(ref(db, `donationRequests/${donationId}`), {
      status: 'approved',
    });
  };

  const handlePickup = () => {
    update(ref(db, `donationRequests/${donationId}`), {
      status: 'picked-up',
      pickedUpAt: new Date().toISOString(),
    });
    setShowRate(true);
  };

  const submitRating = async () => {
    const forUser = donation.createdBy === currentUserId
      ? donation.claimedBy
      : donation.createdBy;

    // Save inside the post
    await update(ref(db, `donationRequests/${donationId}/rating`), {
      stars: rating,
      comment,
      givenBy: currentUserId,
      forUser,
    });

    // Save inside the user node
    await update(ref(db, `users/${forUser}/ratings/${donationId}`), {
      stars: rating,
      comment,
      by: currentUserId,
    });

    setShowRate(false);
  };

  if (!donation || !currentUserId) return null;

  const isOwner = donation.createdBy === currentUserId;
  const isClaimer = donation.claimedBy === currentUserId;
  const alreadyRated = donation.rating?.givenBy === currentUserId;

  return (
    <div className="mt-2">
      {donation.status === 'available' && !isOwner && (
        <button className="btn btn-outline-primary btn-sm" onClick={handleClaim}>Claim</button>
      )}

      {donation.status === 'claimed' && isOwner && (
        <button className="btn btn-outline-success btn-sm" onClick={handleApprove}>Approve Claim</button>
      )}

      {donation.status === 'approved' && isClaimer && (
        <button className="btn btn-outline-warning btn-sm" onClick={handlePickup}>Confirm Pickup</button>
      )}

      {donation.status === 'picked-up' && isClaimer && !alreadyRated && showRate && (
        <div className="mt-3">
          <label>Rate the donor:</label>
          <select
            className="form-select w-auto"
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>{n} Star{n > 1 ? 's' : ''}</option>
            ))}
          </select>
          <textarea
            className="form-control my-2"
            placeholder="Leave a comment (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button className="btn btn-success btn-sm" onClick={submitRating}>Submit Rating</button>
        </div>
      )}

      {donation.status === 'picked-up' && (alreadyRated || !isClaimer) && (
        <p className="text-success">✅ Picked up</p>
      )}
    </div>
  );
};

export default ClaimFlowButtons;
