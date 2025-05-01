import React, { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getDatabase, ref, onValue } from 'firebase/database';

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [userInfo, setUserInfo] = useState({});
  const [stats, setStats] = useState({ made: 0, received: 0 });
  const [ratings, setRatings] = useState([]);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        const db = getDatabase();

        // Fetch personal info
        const userRef = ref(db, `users/${u.uid}`);
        onValue(userRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            setUserInfo(data);
          }
        });

        // Fetch stats
        const postsRef = ref(db, 'donationRequests');
        onValue(postsRef, (snapshot) => {
          const data = snapshot.val();
          if (!data) return;

          let made = 0, received = 0;
          Object.values(data).forEach((post) => {
            if (post.createdBy === u.uid && post.postType === 'donation') made++;
            if (post.claimedBy === u.uid && post.status === 'picked-up') received++;
          });

          setStats({ made, received });
        });

        // Fetch ratings
        const ratingsRef = ref(db, `users/${u.uid}/ratings`);
        onValue(ratingsRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            setRatings(Object.values(data));
          }
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const averageRating = ratings.length
    ? (ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length).toFixed(1)
    : null;

  return (
    <div className="container mt-4">
      <h2>👤 My Profile</h2>

      {userInfo.first_name ? (
        <div className="card p-3 mb-4 bg-light shadow-sm">
          <p><strong>Full Name:</strong> {userInfo.first_name} {userInfo.last_name}</p>
          <p><strong>Account Type:</strong> {userInfo.account_type}</p>
          <p><strong>Phone Number:</strong> {userInfo.phone}</p>
          <p><strong>Address:</strong> {userInfo.address}</p>
        </div>
      ) : (
        <p>Loading profile details...</p>
      )}

      <hr />
      <h4>📊 Donation Stats</h4>
      <p><strong>Total Donations Made:</strong> {stats.made}</p>
      <p><strong>Total Donations Received:</strong> {stats.received}</p>

      <hr />
      <h4>⭐ Ratings</h4>
      {ratings.length === 0 ? (
        <p>No ratings received yet.</p>
      ) : (
        <>
          <p><strong>Average Rating:</strong> {averageRating} / 5</p>
          <ul className="list-group">
            {ratings.map((r, idx) => (
              <li key={idx} className="list-group-item">
                ⭐ {r.stars} – {r.comment || "No comment"}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default UserProfile;
