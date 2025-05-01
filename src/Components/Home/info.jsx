import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserFriends, faUsers } from '@fortawesome/free-solid-svg-icons';
import ScrollTrigger from "react-scroll-trigger";
import Countup from "react-countup";
import '../../App.css';
import { getRoleCounts } from '../../config/rolecount-config';

export default function Info() {
  const [CounterOn, setCounterOn] = useState(false);
  const [counts, setCounts] = useState([0, 0, 0]);

  useEffect(() => {
    getRoleCounts((countsArray) => {
      setCounts(countsArray);
    });
  }, []);

  return (
    <ScrollTrigger onEnter={() => setCounterOn(true)} onExit={() => setCounterOn(false)}>
      <div className="full-info">
        <section className="info">
          <div className="container">
            <div className="info-row">

              {/* Donors */}
              <div className="info-col">
                <FontAwesomeIcon icon={faUserFriends} className="info-icon" style={{ width: '128px', height: '128px', color: 'rgb(35, 202, 35)' }} />
                <p className="info-p">{CounterOn && <Countup start={0} end={counts[1] || 890} duration={3} delay={0} />}+</p>
                <h3>Active Donors</h3>
              </div>

              {/* Volunteers */}
              <div className="info-col">
                <FontAwesomeIcon icon={faUsers} className="info-icon" style={{ width: '128px', height: '128px', color: 'rgb(35, 202, 35)' }} />
                <p className="info-p">{CounterOn && <Countup start={0} end={counts[0] || 1000} duration={3} delay={0} />}+</p>
                <h3>Community Volunteers</h3>
              </div>

              {/* Recipients */}
              <div className="info-col">
                <FontAwesomeIcon icon={faUserFriends} className="info-icon" style={{ width: '128px', height: '128px', color: 'rgb(35, 202, 35)' }} />
                <p className="info-p">{CounterOn && <Countup start={0} end={counts[2] || 706} duration={3} delay={0} />}+</p>
                <h3>Recipients Served</h3>
              </div>

            </div>
          </div>
        </section>
      </div>
    </ScrollTrigger>
  );
}
