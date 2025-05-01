import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Components
import Header from './Components/Header/header';
import WhatWeDo from './Components/Home/WhatWeDo';
import Info from './Components/Home/info';
import SponsorLogo from './Components/Home/sponsorLogo';
import Footer from './Components/Footer/footer';
import Dashboard from './Components/DashBoard/Dashboard';
import Login from './Components/Login&Register/login';
import Register from './Components/Login&Register/register';
import PersonalInfo from './Components/Personal_Info/personal_Info';
import RequestListing from './Components/Donations/RequestListing';
import Analytics from './Components/DashBoard/Profile/Analytics';
import About from './Components/About/about';
import GetInTouch from './Components/GetInTouch/GetInTouch';
import PublicFeed from './Components/PublicFeed/PublicFeed';

import './App.css';

function App() {
  return (
    <Router>
      <div className="App d-flex flex-column min-vh-100">
        {/* Always visible header */}
        <Header />

        {/* Main content area */}
        <div className="flex-grow-1">
          <Routes>
            {/* Home route */}
            <Route
              path="/"
              element={
                <>
                  <WhatWeDo />
                  <Info />
                  <SponsorLogo />
                </>
              }
            />

            {/* Application Routes */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<PersonalInfo />} />
            <Route path="/requests" element={<RequestListing />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/about" element={<About />} />
            <Route path="/get-in-touch" element={<GetInTouch />} />
            <Route path="/feed" element={<PublicFeed />} />
          </Routes>
        </div>

        {/* Always visible footer */}
        <Footer />
      </div>
    </Router>
  );
}

export default App;
