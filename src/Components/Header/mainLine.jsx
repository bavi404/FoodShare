import "../../App.css";
import { useNavigate } from 'react-router-dom';

export default function MainLine({ user, userRole }) {
  const navigate = useNavigate();

  const handleDonateClick = () => {
    if (user) {
      if (userRole === 'donor') {
        navigate("/dashboard");
      } else {
        alert('Please register as a donor to make a donation.');
        navigate("/register");
      }
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="textBox">
      <h1>Food Rescue</h1>
      <p>
        Join us in combating hunger and reducing food waste. Share your surplus meals and bring hope to those in need.
      </p>
      <button className="ExploreBtn" onClick={handleDonateClick}>
        Donate Now
      </button>
    </div>
  );
}
