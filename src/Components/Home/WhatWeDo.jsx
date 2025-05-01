import { we_rescue_food_image, we_create_community_image, happiness_image } from "../../assets";
import '../css/WhatWeDo.css';

export default function WhatWeDo({ id }) {
  return (
    <section id={id}>
      <div className="container mt-5 mb-3">
        <h1 className="centreHeading text-center">What We Do</h1>

        <div className="row m-5">
          {/* Card 1: Rescue */}
          <div className="col">
            <div className="card h-100">
              <img src={we_rescue_food_image} className="card-img-top" alt="Food Rescue in Action" />
              <div className="card-body">
                <h5 className="card-title">We Rescue Surplus Food</h5>
                <p className="card-text">
                  Through our digital platform, volunteers connect surplus food from local donors directly to shelters, pantries, and community kitchens — reducing waste and feeding those in need.
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Community */}
          <div className="col">
            <div className="card h-100">
              <img src={we_create_community_image} className="card-img-top" alt="Community Connection" />
              <div className="card-body">
                <h5 className="card-title">We Empower Communities</h5>
                <p className="card-text">
                  We build a network of kindness. Our platform enables neighbors to help neighbors — fostering trust, dignity, and self-reliance in every delivery.
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Joy */}
          <div className="col">
            <div className="card h-100">
              <img src={happiness_image} className="card-img-top" alt="Joyful Moments" />
              <div className="card-body">
                <h5 className="card-title">We Spread Joy</h5>
                <p className="card-text">
                  A warm meal brings more than nutrition — it brings hope. Every delivery is a chance to lift spirits, nurture connection, and create brighter days for someone in need.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
