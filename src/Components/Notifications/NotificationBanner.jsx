// NotificationBanner.jsx
import React from 'react';

const NotificationBanner = ({ user, donations }) => {
  if (!user || !donations || donations.length === 0) return null;

  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const banners = donations.flatMap((d) => {
    const elements = [];

    // 1. Approved Claim → Notify Claimer
    if (d.status === 'approved' && d.claimedBy === user.uid) {
      elements.push(
        <div key={`approved-${d.id}`} className="alert alert-info">
          ✅ Your claim for <strong>{d.title}</strong> has been approved! Please confirm pickup.
        </div>
      );
    }

    // 2. Expiring Soon → Notify Creator
    const expDate = d.expirationDate ? new Date(d.expirationDate) : null;
    if (
      d.createdBy === user.uid &&
      expDate &&
      expDate <= tomorrow &&
      expDate >= today &&
      d.status !== 'picked-up'
    ) {
      elements.push(
        <div key={`expiring-${d.id}`} className="alert alert-warning">
          ⚠️ Your post <strong>{d.title}</strong> is expiring within 1 day!
        </div>
      );
    }

    return elements;
  });

  return <>{banners}</>;
};

export default NotificationBanner;
