import React, { useRef } from 'react';
import { GoogleMap, MarkerF, useJsApiLoader } from '@react-google-maps/api';

const containerStyle = {
    width: '100%',
    height: '400px',
};

const defaultCenter = {
    lat: 24.8607,
    lng: 67.0011, // Karachi
};

const GoogleMaps = ({ selectedLocationLat, selectedLocationLng }) => {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    });

    const mapRef = useRef(null);
    const handleMapLoad = (map) => {
        mapRef.current = map;
    };

    const activeCenter = selectedLocationLat && selectedLocationLng
        ? { lat: parseFloat(selectedLocationLat), lng: parseFloat(selectedLocationLng) }
        : defaultCenter;

    return (
        <div className="row">
            <div className="col-12">
                <h4 className="title mt-3 mb-3 text-secondary">Google Maps</h4>
                {isLoaded && (
                    <GoogleMap
                        mapContainerStyle={containerStyle}
                        center={activeCenter}
                        zoom={selectedLocationLat && selectedLocationLng ? 15 : 12}
                        onLoad={handleMapLoad}
                    >
                        {/* Always show center marker */}
                        <MarkerF position={defaultCenter} />
                        
                        {/* If selected location is set, show that too */}
                        {selectedLocationLat && selectedLocationLng && (
                            <MarkerF position={activeCenter} />
                        )}
                    </GoogleMap>
                )}
            </div>
        </div>
    );
};

export default GoogleMaps;

