// LocationPicker.jsx (Leaflet version)
import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon issue
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const LocationMarker = ({ setLocation }) => {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setLocation({ lat, lng });
    }
  });
  return null;
};

const LocationPicker = ({ onLocationChange }) => {
  const [location, setLocation] = useState({ lat: null, lng: null });

  const handleManualChange = (e) => {
    const [latStr, lngStr] = e.target.value.split(',');
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    if (!isNaN(lat) && !isNaN(lng)) {
      const newLoc = { lat, lng };
      setLocation(newLoc);
      onLocationChange(newLoc);
    }
  };

  return (
    <div className="mb-4">
      <input
        type="text"
        className="form-control mb-2"
        placeholder="Paste lat, lng (e.g. 12.9716, 77.5946)"
        onChange={handleManualChange}
      />

      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        style={{ height: '300px', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <LocationMarker
          setLocation={(loc) => {
            setLocation(loc);
            onLocationChange(loc);
          }}
        />
        {location.lat && location.lng && (
          <Marker position={[location.lat, location.lng]} />
        )}
      </MapContainer>
    </div>
  );
};

export default LocationPicker;
