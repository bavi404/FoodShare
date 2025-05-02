import React, { useEffect, useState } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import NavigateSidebar from '../Sidebar/NavigateSidebar';
import Metrics from './Metrics';
import FeedMap from '../PublicFeed/FeedMap';
import DonationForm from '../Donations/DonationForm';
import DonationCard from '../PublicFeed/DonationCard';
import NotificationBanner from '../Notifications/NotificationBanner'; // NEW
import '../css/dashboard.css';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [donations, setDonations] = useState([]);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const db = getDatabase();
    const userRef = ref(db, `users/${user.uid}`);
    onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setUserName(data.first_name);
        setUserRole(data.account_type);
      }
    });
  }, [user]);

  useEffect(() => {
    const db = getDatabase();
    const donationRef = ref(db, 'donationRequests');
    onValue(donationRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, val]) => ({ id, ...val }));
        setDonations(list);
      }
    });
  }, []);

  return (
    <div className="container-fluid m-0 p-0">
      <div className="row no-gutters">
        <div className="col-2 p-0">
          <NavigateSidebar userName={userName} />
        </div>

        <div className="col-10 p-4">
          <h5 className="metrics-heading">Dashboard Overview</h5>
          <Metrics />

          {/* Notifications */}
          <NotificationBanner user={user} donations={donations} />

          <hr />

          <h5 className="mt-4">Add a Donation or Request</h5>
          <DonationForm />

          <h4 className="mt-4">All Active Posts</h4>
          {donations.length === 0 ? (
            <p>No donations available.</p>
          ) : (
            donations.map((d) => <DonationCard key={d.id} donation={d} />)
          )}

          <h4 className="mt-4">Map View</h4>
          <FeedMap donations={donations} />
        </div>
      </div>
    </div>
  );

  Object.entries(data).forEach(([id, val]) => {
    const expDate = new Date(val.expirationDate);
    const today = new Date();
  
    if (val.status !== 'picked-up' && expDate < today && val.status !== 'expired') {
      update(ref(db, `donationRequests/${id}`), { status: 'expired' });
    }
  });
  
}
