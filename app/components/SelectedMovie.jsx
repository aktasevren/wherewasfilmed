'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import L from 'leaflet';

const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), {
  ssr: false,
});
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), {
  ssr: false,
});
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), {
  ssr: false,
});
const CircleMarker = dynamic(() => import('react-leaflet').then((mod) => mod.CircleMarker), {
  ssr: false,
});
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), {
  ssr: false,
});

// Component to fit map bounds to all markers
// This must be used inside MapContainer to access useMap hook
const FitBounds = dynamic(
  () =>
    import('react-leaflet').then((mod) => {
      function FitBounds({ coordinates }) {
        const map = mod.useMap();

        useEffect(() => {
          if (!coordinates || coordinates.length === 0) return;

          const validCoordinates = coordinates.filter(
            (coord) => coord.Ycoor !== undefined && coord.Xcoor !== undefined
          );

          if (validCoordinates.length === 0) return;

          try {
            const bounds = L.latLngBounds(
              validCoordinates.map((coord) => [coord.Ycoor, coord.Xcoor])
            );

            // Add padding to bounds for better visibility
            map.fitBounds(bounds, {
              padding: [50, 50],
              maxZoom: 12,
            });
          } catch (error) {
            console.error('Error fitting bounds:', error);
          }
        }, [map, coordinates]);

        return null;
      }
      return FitBounds;
    }),
  { ssr: false }
);

const PLACEHOLDER_IMAGES = [
  '/globe.svg',
  '/window.svg',
  '/file.svg',
  '/next.svg',
  '/vercel.svg',
];

// Location Loading Component
const LocationLoading = ({
  posterUrl,
  title,
  progress,
  noLocations,
  redirectCountdown,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(() =>
    Math.floor(Math.random() * PLACEHOLDER_IMAGES.length)
  );

  const displayImages = posterUrl ? [posterUrl, ...PLACEHOLDER_IMAGES] : PLACEHOLDER_IMAGES;

  useEffect(() => {
    if (displayImages.length > 0) {
      const imageInterval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % displayImages.length);
      }, 2500); // Change image every 2.5 seconds

      return () => clearInterval(imageInterval);
    }
  }, [displayImages.length]);

  const total = progress?.total ?? 0;
  const processed = progress?.processed ?? 0;
  const found = progress?.found ?? 0;
  const percent =
    total > 0 ? Math.max(0, Math.min(100, Math.round((processed / total) * 100))) : 0;

  return (
    <div className="location-loading-container">
      <div className="movie-images-carousel">
        <div className="carousel-image carousel-current">
          <div
            className="carousel-image-inner placeholder-image"
            style={{ backgroundImage: `url(${displayImages[currentImageIndex]})` }}
          />
        </div>
      </div>
      <div className="loading-message-text">
        {noLocations ? (
          <>
            <p className="geocode-redirect">
              No locations found{title ? ` for ${title}` : ''}. Redirecting to home in{' '}
              <b>{redirectCountdown ?? 5}</b>s...
            </p>
          </>
        ) : (
          <>
            <p>
              {title ? (
                <>
                  Geocoding locations for <b>{title}</b>…
                </>
              ) : (
                <>Geocoding locations…</>
              )}
            </p>
            <div className="geocode-progress">
              <div className="geocode-progress-track" aria-hidden="true">
                <div className="geocode-progress-bar" style={{ width: `${percent}%` }} />
              </div>
              <div className="geocode-progress-meta" aria-live="polite">
                {total > 0 ? (
                  <>
                    Processed <b>{processed}</b>/<b>{total}</b> • Found <b>{found}</b>
                  </>
                ) : (
                  <>Searching for locations…</>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Movie Info Header Component – uses poster/logo, optional Wikidata meta (duration, year, description)
const MovieInfoHeader = ({ title, overview, posterUrl, wikidataMeta }) => {
  if (!title) return null;

  const logoUrl = wikidataMeta?.logo || posterUrl || '/assets/film.png';
  const description = wikidataMeta?.description || overview;
  const duration = wikidataMeta?.duration;
  const year = wikidataMeta?.year;
  const hasMeta = duration || year;

  return (
    <div className="movie-info-header">
      <div className="movie-info-content">
        <div className="movie-poster">
          <img
            src={logoUrl}
            alt={`${title} poster`}
            className="poster-image"
            loading="lazy"
            decoding="async"
            width={342}
            height={513}
            sizes="(max-width: 576px) 100px, (max-width: 768px) 120px, 150px"
          />
        </div>
        <div className="movie-info-text">
          <h2 className="movie-title">{title}</h2>
          {hasMeta && (
            <div className="movie-meta-pills" aria-label="Movie details">
              {year != null && (
                <span className="movie-meta-pill movie-meta-pill--year">{year}</span>
              )}
              {duration && (
                <span className="movie-meta-pill movie-meta-pill--duration">
                  <span className="movie-meta-pill-icon" aria-hidden>⏱</span>
                  {duration}
                </span>
              )}
            </div>
          )}
          {description && (
            <p className="movie-overview">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export function SelectedMovie() {
  const router = useRouter();
  const [movieInfos, movieDetails, noMovie, geocodeProgress] = useSelector((state) => [
    state.MovieReducer.movieInfos,
    state.MovieReducer.movieDetails,
    state.MovieReducer.noMovie,
    state.MovieReducer.geocodeProgress,
  ]);

  const [coordinates, setCoordinates] = useState([]);
  const [showMap, setShowMap] = useState(false);
  const loadingStartTimeRef = useRef(0);
  const minLoadingTime = 10000; // Minimum 10 seconds
  const [redirectCountdown, setRedirectCountdown] = useState(null);

  useEffect(() => {
    if (!loadingStartTimeRef.current) loadingStartTimeRef.current = Date.now();
  }, []);

  useEffect(() => {
    async function processLocations() {
      // Wait minimum 5 seconds
      const elapsed = Date.now() - (loadingStartTimeRef.current || Date.now());
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
  }, [movieInfos, minLoadingTime]);

  const noLocations =
    Boolean(noMovie) || (geocodeProgress?.status === 'done' && (geocodeProgress?.found ?? 0) === 0);

  useEffect(() => {
    if (!showMap) return;
    if (!noLocations) return;

    setTimeout(() => setRedirectCountdown(5), 0);
    const interval = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev === null) return 4;
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    const timeout = setTimeout(() => {
      router.push('/');
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [showMap, noLocations, router]);

  const defaultCenter =
    coordinates.length > 0 && coordinates[0].Ycoor && coordinates[0].Xcoor
      ? [coordinates[0].Ycoor, coordinates[0].Xcoor]
      : [55, 60];

  const markerIconUrl =
    movieDetails?.wikidataMeta?.logoIcon || movieDetails?.wikidataMeta?.logo || '/assets/film.png';

  const exactIcon = useMemo(
    () =>
      new L.Icon({
        iconUrl: markerIconUrl,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
        popupAnchor: [0, -30],
        className: 'exact-film-icon',
      }),
    [markerIconUrl]
  );

  return (
    <div className="selected-movie-container">
      {!showMap || coordinates.length === 0 ? (
        <LocationLoading
          posterUrl={movieDetails?.poster_url}
          title={movieDetails?.title || movieDetails?.original_title}
          progress={geocodeProgress}
          noLocations={showMap && noLocations}
          redirectCountdown={redirectCountdown}
        />
      ) : (
        <div className="map-section">
          <MovieInfoHeader
            title={movieDetails?.title || movieDetails?.original_title || 'Unknown Title'}
            overview={movieDetails?.overview || ''}
            posterUrl={movieDetails?.poster_url}
            wikidataMeta={movieDetails?.wikidataMeta}
          />
          <div className="map-legend">
            <div className="legend-title">Locations</div>
            <div className="legend-item">
              <span className="legend-pin"></span>
              Exact place
            </div>
            <div className="legend-item">
              <span className="legend-area"></span>
              Broad region
            </div>
          </div>
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
            <FitBounds coordinates={coordinates} />
            {coordinates.map((elem, index) => {
              const hasPoint = elem.Ycoor !== undefined && elem.Xcoor !== undefined;
              if (!hasPoint) return null;

              const hasBbox = Array.isArray(elem.bbox) && elem.bbox.length === 4;
              const [minLon, minLat, maxLon, maxLat] = hasBbox ? elem.bbox : [];
              const areaSize = hasBbox
                ? Math.max(Math.abs(maxLat - minLat), Math.abs(maxLon - minLon))
                : 0;
              const isBroad =
                hasBbox &&
                (areaSize >= 2 ||
                  ['country', 'state', 'region'].includes(String(elem.placeType)));

              const title = elem.formatted || elem.place;

              if (isBroad) {
                const radius = Math.min(18, Math.max(10, areaSize * 2));
                return (
                  <CircleMarker
                    key={`broad-${index}`}
                    center={[elem.Ycoor, elem.Xcoor]}
                    radius={radius}
                    pathOptions={{ color: '#ff6b4a', fillColor: '#ff6b4a', fillOpacity: 0.55 }}
                  >
                    <Popup className="custom-popup" closeButton={true}>
                      <div className="popup-content">
                        <div className="popup-header">
                          <div className="popup-icon">🗺️</div>
                          <h3 className="popup-title">{title}</h3>
                        </div>
                        <div className="popup-description">
                          <div className="popup-label">Region</div>
                          <p className="popup-text">Broad area — zoom in for details.</p>
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              }

              return (
                <Marker
                  key={`exact-${index}`}
                  position={[elem.Ycoor, elem.Xcoor]}
                  icon={exactIcon}
                >
                  <Popup className="custom-popup" closeButton={true}>
                    <div className="popup-content">
                      <div className="popup-header">
                        <div className="popup-icon">📍</div>
                        <h3 className="popup-title">{title}</h3>
                      </div>
                      {elem.desc && elem.desc !== 'No description available' && (
                        <div className="popup-description">
                          <div className="popup-label">Scene</div>
                          <p className="popup-text">{elem.desc}</p>
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
          </div>
        </div>
      )}
    </div>
  );
}

export default SelectedMovie;

