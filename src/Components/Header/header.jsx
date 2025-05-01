import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { getDatabase, ref, onValue } from 'firebase/database';
import React, { useState, useEffect } from 'react';
import { brandLogo } from "../../assets";
import MainLine from "./mainLine";
import "../../App.css";

export default function Header({ id }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        const db = getDatabase();
        const userRef = ref(db, `users/${user.uid}`);
        onValue(userRef, (snapshot) => {
          const userData = snapshot.val();
          if (userData?.account_type) {
            setUserRole(userData.account_type);
          }
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <section className="Navheader" id={id}>
      <nav>
        <a href="/" className="logo-link">
          <img
            src={brandLogo}
            alt="FoodShare Logo"
            className="logo-image"
            style={{ transition: 'transform 0.3s ease-in-out' }}
          />
        </a>

        <div className="nav-links" id="navlink">
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/dashboard">Dashboard</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/contact">Contact</a></li>
            {user ? (
              <button className="logInBtn" onClick={handleLogout}>
                Log Out
              </button>
            ) : (
              <a href="/login" className="logInBtn">
                Log In
              </a>
            )}
          </ul>
        </div>
      </nav>

      <MainLine user={user} userRole={userRole} />
    </section>
  );
}
