import EnhancedFeedMap from './EnhancedFeedMap';
import apiService from '../../services/apiService';
import wsService from '../../services/websocketService';

const PublicFeed = () => {
  const [donations, setDonations] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [radiusKm, setRadiusKm] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNearby = async (lat, lng, radius) => {
      try {
        const res = await apiService.getDonationsNear(lat, lng, radius, { status: 'available' });
        setDonations(res.data || []);
      } catch (e) {
        setError(e.message || 'Failed to load nearby donations');
      } finally {
        setLoading(false);
      }
    };

    if (!('geolocation' in navigator)) {
      setError('Geolocation not supported');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setUserLocation(coords);
        fetchNearby(coords.latitude, coords.longitude, radiusKm);
      },
      (err) => {
        setError(err.message || 'Failed to get location');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [radiusKm]);

  useEffect(() => {
    wsService.connect();
    const onNewDonation = (payload) => {
      const d = payload?.data?.donation || payload?.donation || payload;
      if (!d || !d.location?.coordinates) return;
      setDonations((prev) => (prev.some((x) => (x.id || x._id) === (d.id || d._id)) ? prev : [d, ...prev]));
    };
    wsService.on('new-donation', onNewDonation);
    wsService.on('donation_created', onNewDonation);
    return () => {
      wsService.off('new-donation', onNewDonation);
      wsService.off('donation_created', onNewDonation);
    };
  }, []);

  if (loading) {
    return <div className="container mt-4"><p>Loading nearby donations...</p></div>;
  }
  if (error) {
    return <div className="container mt-4"><p>{error}</p></div>;
  }

  return (
    <div className="container mt-4">
      <h2 className="mb-3">🍱 Nearby Donations</h2>
      <div className="mb-3">
        <label>Radius: </label>
        <select value={radiusKm} onChange={(e) => setRadiusKm(Number(e.target.value))} style={{ marginLeft: 8 }}>
          <option value={5}>5 km</option>
          <option value={10}>10 km</option>
          <option value={25}>25 km</option>
          <option value={50}>50 km</option>
        </select>
      </div>
      <EnhancedFeedMap
        donations={donations}
        userLocation={userLocation}
        radius={radiusKm}
        onDonationSelect={() => {}}
        onLocationChange={() => {}}
      />
    </div>
  );
};

export default PublicFeed;
