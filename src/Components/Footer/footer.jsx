import "../css/footer.css";
import React, { useState } from 'react';

export default function Footer() {
  const [email, setEmail] = useState("");
  const [isEmailValid, setIsEmailValid] = useState(true);

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
    setIsEmailValid(true);
  };

  const handleSubscribe = () => {
    if (email.trim() === "") {
      setIsEmailValid(false);
      return;
    }

    alert(`You're subscribed! We'll keep you updated at ${email}`);
  };

  return (
    <div className="custom-main-footer container">
      <footer className="pt-5 pb-3">
        <div className="row">
          {/* Navigation */}
          <div className="col-2">
            <h5>Explore</h5>
            <ul className="nav flex-column">
              <li className="nav-item abc mb-2"><a href="/" className="nav-link p-0">Home</a></li>
              <li className="nav-item abc mb-2"><a href="#whatwedo" className="nav-link p-0">Our Work</a></li>
              <li className="nav-item abc mb-2"><a href="#sponsors" className="nav-link p-0">Partners</a></li>
              <li className="nav-item abc mb-2"><a href="/contact" className="nav-link p-0">Contact</a></li>
            </ul>
          </div>

          {/* About */}
          <div className="col-4">
            <h5>Who We Are</h5>
            <p className="p-0">
              FoodShare is committed to reducing hunger and preventing food waste. Our platform connects excess nutritious food with local communities in need—diverting it from landfills while nourishing lives. Join us in creating a more sustainable and compassionate world.
            </p>
          </div>

          {/* Newsletter */}
          <div className="col-5 offset-1">
            <form>
              <h5>Stay Updated</h5>
              <p>Get monthly updates, impact stories, and volunteer opportunities straight to your inbox.</p>
              <div className="d-flex w-100 gap-2">
                <label htmlFor="newsletter1" className="visually-hidden">Email address</label>
                <input
                  id="newsletter1"
                  type="text"
                  className={`form-control ${isEmailValid ? "" : "is-invalid"}`}
                  placeholder="Email address"
                  value={email}
                  onChange={handleEmailChange}
                />
                <button type="button" className="SubscribeBtn" onClick={handleSubscribe}>
                  Subscribe
                </button>
              </div>
              {!isEmailValid && <div className="invalid-feedback">Please enter a valid email.</div>}
            </form>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="d-flex justify-content-between border-top pr-5 mt-3">
          <p>&copy; 2024 FoodShare. Empowering change, one meal at a time.</p>
          <ul className="list-unstyled d-flex mt-2 icon">
            <li className="ms-3"><a className="link-dark" href="/contact" aria-label="Email"><svg xmlns="http://www.w3.org/2000/svg" height="25" width="25" viewBox="0 0 448 512"><path d="..." /></svg></a></li>
            <li className="ms-3"><a className="link-dark" href="/contact" aria-label="Instagram"><svg xmlns="http://www.w3.org/2000/svg" height="25" width="25" viewBox="0 0 448 512"><path d="..." /></svg></a></li>
            <li className="ms-3"><a className="link-dark" href="/contact" aria-label="Facebook"><svg xmlns="http://www.w3.org/2000/svg" height="25" width="25" viewBox="0 0 512 512"><path d="..." /></svg></a></li>
          </ul>
        </div>
      </footer>
    </div>
  );
}
