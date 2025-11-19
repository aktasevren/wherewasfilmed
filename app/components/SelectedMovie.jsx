'use client';

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import dynamic from 'next/dynamic';

const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), {
  ssr: false,
});
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), {
  ssr: false,
});
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), {
  ssr: false,
});
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), {
  ssr: false,
});

// Dynamic import for client-side Leaflet icon usage
const getLeafletIcon = () => {
  if (typeof window !== 'undefined') {
    const L = require('leaflet');
    return L.Icon;
  }
  return null;
};

// Location Loading Component
const LocationLoading = () => {
  const loadingMessages = [
    'Searching for filming locations...',
    'Loading map...',
    'Calculating coordinates...',
    'Detecting film sets...',
    'Preparing locations...',
  ];

  const [currentMessage, setCurrentMessage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % loadingMessages.length);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="location-loading-container">
      <div className="loading-content">
        <div className="loading-animation">
          <div className="globe-wrapper">
            <div className="globe">
              <div className="globe-inner">
                <div className="map-pin map-pin-1">📍</div>
                <div className="map-pin map-pin-2">📍</div>
                <div className="map-pin map-pin-3">📍</div>
              </div>
            </div>
          </div>
          <div className="pulse-ring pulse-ring-1"></div>
          <div className="pulse-ring pulse-ring-2"></div>
          <div className="pulse-ring pulse-ring-3"></div>
        </div>
        
        <div className="loading-text">
          <h2 className="loading-title">Finding Locations</h2>
          <p className="loading-message">{loadingMessages[currentMessage]}</p>
          <div className="loading-progress">
            <div className="progress-bar"></div>
          </div>
        </div>

        <div className="loading-features">
          <div className="feature-dot feature-dot-1"></div>
          <div className="feature-dot feature-dot-2"></div>
          <div className="feature-dot feature-dot-3"></div>
        </div>
      </div>
    </div>
  );
};

export function SelectedMovie() {
  const [movieInfos, poster] = useSelector((state) => [
    state.MovieReducer.movieInfos,
    state.MovieReducer.poster,
  ]);

  const [coordinates, setCoordinates] = useState([]);
  const [showMap, setShowMap] = useState(false);
  const [loadingStartTime] = useState(Date.now());
  const [minLoadingTime] = useState(5000); // Minimum 5 seconds

  useEffect(() => {
    async function processLocations() {
      // Wait minimum 5 seconds
      const elapsed = Date.now() - loadingStartTime;
      const remainingTime = Math.max(0, minLoadingTime - elapsed);
      
      await new Promise((resolve) => setTimeout(resolve, remainingTime));
      
      // Set coordinates
      if (movieInfos && movieInfos.length > 0) {
        setCoordinates(movieInfos);
        setShowMap(true);
      } else {
        // Wait minimum time even if no locations found
        setShowMap(true);
      }
    }

    if (movieInfos) {
      processLocations();
    }
  }, [movieInfos, loadingStartTime, minLoadingTime]);

  const defaultCenter =
    coordinates.length > 0 && coordinates[0].Ycoor && coordinates[0].Xcoor
      ? [coordinates[0].Ycoor, coordinates[0].Xcoor]
      : [55, 60];

  return (
    <div className="selected-movie-container">
      {!showMap || coordinates.length === 0 ? (
        <LocationLoading />
      ) : (
        <div className="map-wrapper">
          <MapContainer
            center={defaultCenter}
            zoom={3}
            minZoom={0}
            maxZoom={12}
            scrollWheelZoom={true}
            className="map-container"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://tile.openstreetmap.de/{z}/{x}/{y}.png"
            />
            {coordinates.map(
              (elem, index) =>
                elem.Ycoor !== undefined &&
                elem.Xcoor !== undefined && (
                  <Marker
                    key={index}
                    position={[elem.Ycoor, elem.Xcoor]}
                    icon={
                      (() => {
                        const Icon = getLeafletIcon();
                        if (Icon) {
                          return new Icon({
                            iconUrl: '/assets/film.png',
                            iconSize: [40, 40],
                            iconAnchor: [20, 40],
                            popupAnchor: [0, -40],
                            className: 'custom-marker-icon',
                          });
                        }
                        return null;
                      })()
                    }
                  >
                    <Popup className="custom-popup" closeButton={true}>
                      <div className="popup-content">
                        <div className="popup-header">
                          <div className="popup-icon">🎬</div>
                          <h3 className="popup-title">{movieInfos[index].place}</h3>
                        </div>
                        {movieInfos[index].desc && movieInfos[index].desc !== 'No description available' && (
                          <div className="popup-description">
                            <div className="popup-label">Scene</div>
                            <p className="popup-text">{movieInfos[index].desc}</p>
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                )
            )}
          </MapContainer>
        </div>
      )}
    </div>
  );
}

export default SelectedMovie;

