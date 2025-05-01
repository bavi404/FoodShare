// FeedMap.jsx
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import foodMarker from '../../assets/food-marker.png'; // <-- your custom logo

// Recenter the map on load
const RecenterMap = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center[0] && center[1]) {
      map.setView(center, 13);
    }
  }, [center, map]);
  return null;
};

// Define your custom icon
const customFoodIcon = L.icon({
  iconUrl: foodMarker,
  iconSize: [30, 40], // size of the icon
  iconAnchor: [15, 40], // point of the icon which will correspond to marker's location
  popupAnchor: [0, -30], // point from which the popup should open
});

const FeedMap = ({ donations = [] }) => {
  const defaultCenter =
    donations.length > 0 && donations[0].location
      ? [donations[0].location.lat, donations[0].location.lng]
      : [20.5937, 78.9629]; // fallback (India)

  return (
    <MapContainer
      center={defaultCenter}
      zoom={5}
      scrollWheelZoom={true}
      style={{ height: '400px', width: '100%', borderRadius: '8px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      />
      <RecenterMap center={defaultCenter} />

      {donations
        .filter((d) => ['available', 'claimed', 'approved'].includes(d.status)) // Only active
        .map((d) =>
          d.location?.lat && d.location?.lng ? (
            <Marker
              key={d.id}
              position={[d.location.lat, d.location.lng]}
              icon={customFoodIcon}
            >
              <Popup>
                <b>{d.title}</b><br />
                <strong>Type:</strong> {d.postType}<br />
                <strong>Status:</strong> {d.status}<br />
                <strong>Food:</strong> {d.foodType}<br />
                <strong>Quantity:</strong> {d.foodQuantity}<br />
                <strong>Weight:</strong> {d.foodWeight}kg
              </Popup>
            </Marker>
          ) : null
        )}
    </MapContainer>
  );
};

export default FeedMap;
