import React from 'react';
import Header from '../Header/header';
import '../css/about.css';

const About = () => {
  return (
    <>
      {/* Header already appears globally, so this can be removed if you're sure */}
      {/* <Header /> */}

      <div className="MissionVisionContainer">
        <section className="Mission">
          <div className="innerDiv">
            <h2>Our Mission</h2>
            <div className="content">
              At FoodShare, our mission is to combat food waste and hunger by connecting individuals, restaurants, and grocery stores with surplus food to local shelters and people in need. Through a simple digital platform, we empower communities to share resources, reduce waste, and support those facing food insecurity.
            </div>
          </div>
        </section>

        <section className="Vision">
          <div className="innerDiv">
            <h2>Our Vision</h2>
            <div className="content">
              We envision a world where no meal goes to waste and no person goes hungry. FoodShare strives to build a sustainable ecosystem where surplus food is redistributed efficiently, bridging the gap between abundance and need — with technology as the enabler and compassion as the driver.
            </div>
          </div>
        </section>
      </div>

      {/* Footer is already rendered in App.jsx – removed here */}
    </>
  );
};

export default About;
