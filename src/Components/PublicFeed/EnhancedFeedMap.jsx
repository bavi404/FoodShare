import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import wsService from '../../services/websocketService';
import apiService from '../../services/apiService';
import './EnhancedFeedMap.css';

// Set Mapbox access token
mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN || 'your-mapbox-token';

const EnhancedFeedMap = ({ 
  donations = [], 
  onDonationSelect, 
  userLocation, 
  onLocationChange,
  radius = 10 
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef(new Map());
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [mapCenter, setMapCenter] = useState([-74.006, 40.7128]); // Default to NYC
  const [mapZoom, setMapZoom] = useState(10);

  // Initialize map
  useEffect(() => {
    if (map.current) return; // Initialize map only once

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: userLocation ? [userLocation.longitude, userLocation.latitude] : mapCenter,
      zoom: mapZoom,
      pitch: 45,
      bearing: 0
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add geolocate control
    const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true,
      showUserHeading: true
    });
    map.current.addControl(geolocate, 'top-right');

    // Handle map load
    map.current.on('load', () => {
      setIsMapLoaded(true);
      addRadiusCircle();
    });

    // Handle map click
    map.current.on('click', (e) => {
      const features = map.current.queryRenderedFeatures(e.point, {
        layers: ['donation-markers']
      });

      if (features.length > 0) {
        const donationId = features[0].properties.donationId;
        const donation = donations.find(d => d.id === donationId);
        if (donation) {
          setSelectedDonation(donation);
          onDonationSelect?.(donation);
        }
      } else {
        setSelectedDonation(null);
        onDonationSelect?.(null);
      }
    });

    // Handle map move end
    map.current.on('moveend', () => {
      const center = map.current.getCenter();
      const zoom = map.current.getZoom();
      
      setMapCenter([center.lng, center.lat]);
      setMapZoom(zoom);
      
      // Update location if user moved significantly
      if (onLocationChange) {
        onLocationChange({
          latitude: center.lat,
          longitude: center.lng
        });
      }
    });

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Add radius circle
  const addRadiusCircle = useCallback(() => {
    if (!map.current || !isMapLoaded) return;

    // Remove existing radius circle
    if (map.current.getSource('radius-circle')) {
      map.current.removeLayer('radius-circle-fill');
      map.current.removeLayer('radius-circle-stroke');
      map.current.removeSource('radius-circle');
    }

    const center = map.current.getCenter();
    const radiusInMeters = radius * 1000;

    map.current.addSource('radius-circle', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [center.lng, center.lat]
        }
      }
    });

    // Add circle fill
    map.current.addLayer({
      id: 'radius-circle-fill',
      type: 'fill',
      source: 'radius-circle',
      paint: {
        'fill-color': '#007cbf',
        'fill-opacity': 0.1
      },
      filter: ['==', '$type', 'Point']
    });

    // Add circle stroke
    map.current.addLayer({
      id: 'radius-circle-stroke',
      type: 'line',
      source: 'radius-circle',
      paint: {
        'line-color': '#007cbf',
        'line-width': 2,
        'line-opacity': 0.8
      },
      filter: ['==', '$type', 'Point']
    });

    // Create circle geometry
    const circle = createCircle([center.lng, center.lat], radiusInMeters);
    map.current.getSource('radius-circle').setData(circle);

  }, [isMapLoaded, radius]);

  // Create circle geometry
  const createCircle = (center, radiusInMeters) => {
    const points = 64;
    const coords = [];
    
    for (let i = 0; i < points; i++) {
      const angle = (i * 360) / points;
      const dx = radiusInMeters * Math.cos(angle * Math.PI / 180);
      const dy = radiusInMeters * Math.sin(angle * Math.PI / 180);
      
      // Convert meters to degrees (approximate)
      const lng = center[0] + (dx / (111320 * Math.cos(center[1] * Math.PI / 180)));
      const lat = center[1] + (dy / 110540);
      
      coords.push([lng, lat]);
    }
    
    coords.push(coords[0]); // Close the circle
    
    return {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [coords]
      }
    };
  };

  // Update radius circle when radius changes
  useEffect(() => {
    if (isMapLoaded) {
      addRadiusCircle();
    }
  }, [radius, addRadiusCircle]);

  // Update markers when donations change
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current.clear();

    // Add donation markers
    donations.forEach(donation => {
      if (donation.location && donation.location.coordinates) {
        const [lng, lat] = donation.location.coordinates;
        
        // Create custom marker element
        const el = document.createElement('div');
        el.className = 'donation-marker';
        el.style.backgroundImage = `url(${getMarkerIcon(donation.foodType, donation.status)})`;
        el.style.width = '30px';
        el.style.height = '30px';
        el.style.borderRadius = '50%';
        el.style.border = '2px solid white';
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        el.style.cursor = 'pointer';
        el.style.backgroundSize = 'cover';
        el.style.backgroundPosition = 'center';

        // Add click handler
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          setSelectedDonation(donation);
          onDonationSelect?.(donation);
        });

        // Create marker
        const marker = new mapboxgl.Marker(el)
          .setLngLat([lng, lat])
          .addTo(map.current);

        // Store marker reference
        markers.current.set(donation.id, marker);
      }
    });
  }, [donations, isMapLoaded, onDonationSelect]);

  // Update map center when user location changes
  useEffect(() => {
    if (map.current && userLocation) {
      map.current.flyTo({
        center: [userLocation.longitude, userLocation.latitude],
        zoom: 12,
        duration: 1000
      });
    }
  }, [userLocation]);

  // WebSocket event handlers
  useEffect(() => {
    const handleDonationCreated = (data) => {
      console.log('New donation created:', data);
      // The parent component should handle adding new donations to the list
    };

    const handleDonationClaimed = (data) => {
      console.log('Donation claimed:', data);
      // Update the specific donation in the list
    };

    const handleDonationUpdated = (data) => {
      console.log('Donation updated:', data);
      // Update the specific donation in the list
    };

    // Subscribe to WebSocket events
    wsService.on('donation_created', handleDonationCreated);
    wsService.on('donation_claimed', handleDonationClaimed);
    wsService.on('donation_updated', handleDonationUpdated);

    // Subscribe to nearby donations
    if (userLocation) {
      wsService.subscribeNearby(userLocation.latitude, userLocation.longitude, radius);
    }

    return () => {
      wsService.off('donation_created', handleDonationCreated);
      wsService.off('donation_claimed', handleDonationClaimed);
      wsService.off('donation_updated', handleDonationUpdated);
    };
  }, [userLocation, radius]);

  // Get marker icon based on food type and status
  const getMarkerIcon = (foodType, status) => {
    const baseUrl = '/assets/markers/';
    const statusSuffix = status === 'available' ? '' : `-${status}`;
    return `${baseUrl}${foodType.toLowerCase()}${statusSuffix}.png`;
  };

  // Fit map to show all donations
  const fitToDonations = useCallback(() => {
    if (!map.current || donations.length === 0) return;

    const coordinates = donations
      .filter(d => d.location && d.location.coordinates)
      .map(d => d.location.coordinates);

    if (coordinates.length > 0) {
      const bounds = coordinates.reduce((bounds, coord) => {
        return bounds.extend(coord);
      }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15
      });
    }
  }, [donations]);

  return (
    <div className="enhanced-feed-map">
      <div className="map-controls">
        <button 
          className="control-btn"
          onClick={fitToDonations}
          disabled={donations.length === 0}
        >
          📍 Show All
        </button>
        <button 
          className="control-btn"
          onClick={() => map.current?.flyTo({ center: mapCenter, zoom: 10 })}
        >
          🎯 Center
        </button>
      </div>
      
      <div ref={mapContainer} className="map-container" />
      
      {selectedDonation && (
        <div className="donation-popup">
          <h3>{selectedDonation.title}</h3>
          <p><strong>Type:</strong> {selectedDonation.foodType}</p>
          <p><strong>Status:</strong> {selectedDonation.status}</p>
          <p><strong>Quantity:</strong> {selectedDonation.quantity?.amount} {selectedDonation.quantity?.unit}</p>
          <p><strong>Weight:</strong> {selectedDonation.weight}kg</p>
          <p><strong>Address:</strong> {selectedDonation.location?.address}</p>
          <div className="popup-actions">
            <button 
              className="btn-primary"
              onClick={() => {
                // Handle claim action
                console.log('Claim donation:', selectedDonation.id);
              }}
            >
              Claim
            </button>
            <button 
              className="btn-secondary"
              onClick={() => setSelectedDonation(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedFeedMap;
