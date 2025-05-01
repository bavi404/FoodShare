import { partner1, partner2, partner3, partner4, partner5, partner6, partner7 } from "../../assets";
import '../css/sponsorLogo.css';

export default function SponsorLogo({ id }) {
  return (
    <section id={id} className="sponsor-section">
      <div className="mainContainer">
        <div className="customContainer">
          <h1 className="text-center mb-4">Our Partners</h1>
          <p className="text-muted text-center mb-5">
            We’re grateful to work alongside these amazing organizations in our mission to fight hunger and food waste.
          </p>

          <div className="client">
            <ul className="d-flex flex-wrap justify-content-center align-items-center gap-4">
              {[partner1, partner2, partner3, partner4, partner6, partner5, partner7].map((logo, index) => (
                <li key={index}>
                  <img src={logo} alt={`partner-logo-${index + 1}`} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
