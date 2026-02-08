'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import L from 'leaflet';
import {
  IconLocationOn,
  IconLightbulb,
  IconMap,
  IconSchedule,
  IconNorthEast,
  IconRefresh,
} from '@/app/components/Icons';

import 'react-leaflet-cluster/dist/assets/MarkerCluster.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.Default.css';

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
const MarkerClusterGroup = dynamic(
  () => import('react-leaflet-cluster').then((mod) => mod.default),
  { ssr: false }
);

// Fit map bounds to all markers (runs on mount and when coordinates change)
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

// Reset map view (fit bounds again) — used when user clicks "Reset Map"
const MapResetControl = dynamic(
  () =>
    import('react-leaflet').then((mod) => {
      function MapResetControl({ coordinates, resetTrigger }) {
        const map = mod.useMap();

        useEffect(() => {
          if (!coordinates?.length || resetTrigger == null) return;

          const valid = coordinates.filter(
            (c) => c.Ycoor !== undefined && c.Xcoor !== undefined
          );
          if (valid.length === 0) return;

          try {
            const bounds = L.latLngBounds(
              valid.map((c) => [c.Ycoor, c.Xcoor])
            );
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
          } catch (e) {}
        }, [resetTrigger]);

        return null;
      }
      return MapResetControl;
    }),
  { ssr: false }
);

// Lokasyon kartına tıklanınca haritada o noktaya uçar
const MapFlyToLocation = dynamic(
  () =>
    import('react-leaflet').then((mod) => {
      function MapFlyToLocation({ coordinates, flyToIndex }) {
        const map = mod.useMap();

        useEffect(() => {
          if (flyToIndex == null || !coordinates?.length) return;
          const c = coordinates[flyToIndex];
          if (c?.Ycoor == null || c?.Xcoor == null) return;
          try {
            map.flyTo([c.Ycoor, c.Xcoor], 12, { duration: 0.8 });
          } catch (e) {}
        }, [map, coordinates, flyToIndex]);

        return null;
      }
      return MapFlyToLocation;
    }),
  { ssr: false }
);

// Harita container boyutu değişince Leaflet'in invalidateSize ile güncellemesi
const MapResize = dynamic(
  () =>
    import('react-leaflet').then((mod) => {
      function MapResize() {
        const map = mod.useMap();
        useEffect(() => {
          const t = setTimeout(() => {
            try {
              map.invalidateSize();
            } catch (e) {}
          }, 100);
          return () => clearTimeout(t);
        }, [map]);
        return null;
      }
      return MapResize;
    }),
  { ssr: false }
);

// Tasarım birebir: Did you know kartı için sabit örnek (Star Wars / Tunisia)
const DID_YOU_KNOW_CARD = {
  imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDCAcqOn4gFh0AjqWQPW_-k4mwcBb8uFIOrRbwNNnpbhz4sLQOU_CR30_PJtDvYl_AawNQVgj6xii2bSEM14SOH57m0g3KU0COgGsBZuLcBrJJ0Nehp72YYbOLZyTpZVj3W6nKQaHjoq6MHbSR7PcRrVqdJIqnkPvg9NZF0AJ0XNGHfW2GeGD0yWjKRm4V-q-5W43B_9CVLKc5WV70XZX3Skz4qkdM4hhHOqH1TIY8AJCQ-TUkIidTnrVW1obrpbgdihkgV4E60vYzX',
  title: 'The Tunisian Desert Origins',
  body: 'The desert scenes for Tatooine were filmed in Tunisia, where some sets still stand today. The local town of Matmata features underground "troglodyte" houses used for the Lars Homestead.',
  location: 'Tunisia, Africa',
  year: 'Filmed in 1976',
};

// Location Loading Component — yükleme ekranı, ferah layout
const LocationLoading = ({
  title,
  noLocations,
  redirectCountdown,
}) => {
  const bgImageUrl = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBx_D7M73P067zYOZ6dSXZhl_4120cP67VXWpJznmdOpc6dgj2mwdFq7Gbt5c2F38VQT4Fc6wzI0M4Qg0V8yuuvHzkeqAPGApA1i4sGsPOUn-nhiemUB70vp2NOp2Fw-mTYswi97TNtMV_dQ6orDkIW36wYvSKQzMBRYAynEG28LaQ97RROD5jsZrNO3ijyJaKUijiLwZenEdqYQnVH_G9PMu86AntpOg-4koCTLc0NwcDPkiXPUmAIoRwIsjbh6FTU0vtNamlY0jcw';

  return (
    <div className="fixed inset-0 z-0 bg-[#101022] overflow-auto">
      {/* Cinematic Background with Blur */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#101022]/60 via-[#101022]/80 to-[#101022] z-10" />
        <div
          className="w-full h-full bg-center bg-no-repeat bg-cover scale-110 blur-md opacity-40"
          style={{ backgroundImage: `url("${bgImageUrl}")` }}
          aria-hidden
        />
      </div>

      {/* Main: flex column, orta blok üstte ferah, altta kart — çakışma yok */}
      <main className="relative z-20 flex flex-col min-h-screen w-full px-6 sm:px-8 lg:px-12 pt-24 pb-8">
        {/* Central Loading Focus — yeterli boşluk */}
        <div className="flex-1 flex flex-col items-center justify-center min-h-[280px] py-12 sm:py-16">
          <div className="flex flex-col items-center gap-14 sm:gap-16 max-w-2xl text-center">
            <div className="relative w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center">
              {/* Pulse Rings */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 sm:w-40 sm:h-40 border-2 border-[#1111d4]/40 rounded-full animate-ping" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-44 h-44 sm:w-56 sm:h-56 border border-[#1111d4]/20 rounded-full animate-pulse" />
              </div>
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 bg-[#1111d4]/20 border border-[#1111d4]/50 rounded-full flex items-center justify-center glow-pulse">
                <IconLocationOn size={56} className="text-[#1111d4] animate-bounce" />
              </div>
            </div>
            <div className="space-y-5">
              {noLocations ? (
                <>
                  <h1 className="text-white text-3xl sm:text-4xl md:text-5xl font-bold tracking-tighter px-2">
                    No filming locations found
                  </h1>
                  <p className="text-white/70 text-lg sm:text-xl font-medium px-2">
                    Redirecting to homepage in {redirectCountdown ?? 5} second{(redirectCountdown ?? 5) === 1 ? '' : 's'}…
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-white text-3xl sm:text-4xl md:text-5xl font-bold tracking-tighter px-2">
                    Mapping the Galaxy...
                  </h1>
                  <p className="text-white/60 text-base sm:text-lg font-medium max-w-lg mx-auto leading-relaxed">
                    Geocoding filming locations for{' '}
                    <span className="text-white">{title || 'this film'}</span>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Trivia Card — altta, sabit değil akışta; sıkışıklık yok */}
        <div className="w-full max-w-3xl mx-auto mt-8 sm:mt-12 flex-shrink-0">
          <div className="blur-backdrop bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row gap-8 items-start">
            <div className="w-full md:w-56 lg:w-64 aspect-video rounded-xl overflow-hidden flex-shrink-0">
              <div
                className="w-full h-full bg-center bg-no-repeat bg-cover transform hover:scale-105 transition-transform duration-500"
                style={{ backgroundImage: `url("${DID_YOU_KNOW_CARD.imageUrl}")` }}
                aria-hidden
              />
            </div>
            <div className="flex flex-col gap-3 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <IconLightbulb size={20} className="text-[#1111d4] flex-shrink-0" />
                <span className="text-[#1111d4] font-bold text-xs uppercase tracking-widest">Did You Know?</span>
              </div>
              <h3 className="text-white text-xl font-bold leading-snug">{DID_YOU_KNOW_CARD.title}</h3>
              <p className="text-white/60 text-sm sm:text-base leading-relaxed">{DID_YOU_KNOW_CARD.body}</p>
              <div className="mt-1 flex flex-wrap items-center gap-5">
                <div className="flex items-center gap-2 text-sm text-white/40">
                  <IconMap size={16} className="flex-shrink-0" />
                  <span>{DID_YOU_KNOW_CARD.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/40">
                  <IconSchedule size={16} className="flex-shrink-0" />
                  <span>{DID_YOU_KNOW_CARD.year}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 flex justify-center items-center gap-4">
            <span className="text-white/30 text-[11px] tracking-[0.25em] uppercase">Loading Cinematic Database</span>
            <div className="flex gap-1.5">
              <div className="w-2 h-2 bg-[#1111d4] rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
              <div className="w-2 h-2 bg-[#1111d4] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 bg-[#1111d4] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        </div>
      </main>

      {/* Gradient overlays */}
      <div className="fixed inset-0 pointer-events-none z-50">
        <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-[#101022]/50 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-[#101022]/50 to-transparent" />
      </div>
    </div>
  );
};

function SelectedMovie({ onLoadingChange }) {
  const router = useRouter();
  const [movieInfos, movieDetails, noMovie, geocodeProgress] = useSelector((state) => [
    state.MovieReducer.movieInfos,
    state.MovieReducer.movieDetails,
    state.MovieReducer.noMovie,
    state.MovieReducer.geocodeProgress,
  ]);

  const [coordinates, setCoordinates] = useState([]);
  const [showMap, setShowMap] = useState(false);
  const [mapResetTrigger, setMapResetTrigger] = useState(0);
  const [flyToLocationIndex, setFlyToLocationIndex] = useState(null);
  const loadingStartTimeRef = useRef(0);
  const minLoadingTime = 10000; // Minimum 10 seconds
  const [redirectCountdown, setRedirectCountdown] = useState(null);
  const containerRef = useRef(null);
  const mapSectionRef = useRef(null);
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
    onLoadingChange?.(!showMap);
  }, [showMap, onLoadingChange]);

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

  const isMapView = showMap && coordinates.length > 0;

  return (
    <div
      ref={containerRef}
      className={`selected-movie-container${isMapView ? ' selected-movie-container--map' : ''}`}
      style={isMapView ? { flexShrink: 0 } : undefined}
    >
      {!showMap || coordinates.length === 0 ? (
        <LocationLoading
          title={movieDetails?.title || movieDetails?.original_title || 'Filming Locations'}
          noLocations={showMap && noLocations}
          redirectCountdown={redirectCountdown}
        />
      ) : (
        <div className="map-screen flex flex-1 min-h-0 w-full self-stretch">
          {/* Sidebar: yükseklik içeriğe göre; liste uzadıkça sayfa scroll eder */}
          <aside className="map-screen-sidebar flex flex-col w-full max-w-[380px] flex-shrink-0">
            <div className="map-screen-featured p-8 border-b border-white/10">
              <div className="flex items-center gap-3 text-primary text-[10px] font-bold uppercase tracking-[0.3em] mb-5">
                <span className="h-px w-10 bg-primary" aria-hidden />
                Featured Production
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-[1.75rem] font-semibold leading-tight text-white mb-4 tracking-tight">
                {movieDetails?.title || movieDetails?.original_title || 'Filming Locations'}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mb-6">
                {movieDetails?.wikidataMeta?.year != null && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider border border-primary/30">
                    {movieDetails.wikidataMeta.year}
                  </span>
                )}
                {movieDetails?.wikidataMeta?.duration && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-semibold uppercase tracking-wider border border-white/20">
                    {movieDetails.wikidataMeta.duration}
                  </span>
                )}
              </div>
              <p className="text-white/80 text-sm leading-relaxed border-l-4 border-primary pl-4 py-1 bg-white/5 rounded-r">
                {(movieDetails?.wikidataMeta?.description || movieDetails?.overview) || 'No description available.'}
              </p>
            </div>

            <div className="map-screen-location-list flex flex-col">
              <div className="px-4 pt-3 pb-1">
                <h3 className="text-[10px] font-bold text-primary tracking-[0.25em] flex items-center gap-2 uppercase">
                  Filming Locations
                  <span className="h-px flex-1 bg-white/5" aria-hidden />
                </h3>
              </div>
              {coordinates.map((loc, index) => {
                const locationLine = (loc.formatted || loc.place || 'Location').trim() || 'Location';
                const desc = loc.desc && loc.desc !== 'No description available' ? loc.desc : null;
                return (
                  <button
                    type="button"
                    key={`${loc.place}-${index}`}
                    className="map-screen-location-card group cursor-pointer px-4 py-1.5 w-full text-left"
                    onClick={() => setFlyToLocationIndex(index)}
                  >
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-amber-400/95 group-hover:text-amber-300 transition-colors truncate">
                          {locationLine}
                        </span>
                        <IconNorthEast size={12} className="text-white/20 group-hover:text-primary transition-all flex-shrink-0" />
                      </div>
                      {desc && (
                        <p className="text-[10px] text-amber-400/90 italic leading-tight line-clamp-1">
                          {desc}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

          </aside>

          {/* Harita: sticky wrapper ile sayfa scroll ederken ekranda sabit kalır; kontroller harita alanı içinde */}
          <section
            ref={mapSectionRef}
            className="map-screen-map relative flex-1 min-w-0"
          >
            <div className="map-screen-map-sticky relative z-0">
              <div className="map-screen-map-inner">
                <div className="absolute inset-0 w-full h-full z-0">
                <MapContainer
                center={defaultCenter}
                zoom={5}
                minZoom={0}
                maxZoom={12}
                scrollWheelZoom
                className="map-screen-leaflet"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://tile.openstreetmap.de/{z}/{x}/{y}.png"
                />
                <MapResize />
                <FitBounds coordinates={coordinates} />
                <MapResetControl coordinates={coordinates} resetTrigger={mapResetTrigger} />
                <MapFlyToLocation coordinates={coordinates} flyToIndex={flyToLocationIndex} />
                <MarkerClusterGroup chunkedLoading>
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
                        pathOptions={{
                          color: 'rgb(17, 17, 212)',
                          fillColor: '#1111d4',
                          fillOpacity: 0.45,
                          weight: 1,
                        }}
                      >
                        <Popup className="custom-popup" closeButton>
                          <div className="popup-content">
                            <div className="popup-header">
                              <h3 className="popup-title">{title}</h3>
                            </div>
                            <div className="popup-description">
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
                      <Popup className="custom-popup" closeButton>
                        <div className="popup-content">
                          <div className="popup-header">
                            <h3 className="popup-title">{title}</h3>
                          </div>
                          {elem.desc && elem.desc !== 'No description available' && (
                            <div className="popup-description">
                              <p className="popup-text">{elem.desc}</p>
                            </div>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
                </MarkerClusterGroup>
              </MapContainer>
                </div>

                {/* Gradient overlay — Leaflet üstünde (z-index > leaflet) */}
                <div className="absolute inset-0 z-[1100] pointer-events-none bg-gradient-to-r from-[#0a0a0a]/35 to-transparent" />

                {/* Top center: Exploring + Reset — harita üstünde */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1100]">
              <div className="bg-[#0a0a0a]/60 backdrop-blur-md border border-white/10 rounded-full px-6 py-2.5 flex items-center gap-5 shadow-xl">
                <span className="text-[10px] font-medium tracking-widest text-white/60 uppercase">
                  Exploring: <span className="text-primary font-bold">{movieDetails?.title || movieDetails?.original_title || 'Filming Locations'}</span>
                </span>
                <div className="h-3 w-px bg-white/10" aria-hidden />
                <button
                  type="button"
                  className="text-[10px] font-bold text-white/30 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-2"
                  onClick={() => setMapResetTrigger((t) => t + 1)}
                >
                  Reset Map
                  <IconRefresh size={14} />
                </button>
              </div>
            </div>

                {/* Sol üst: legend — harita üstünde */}
                <div className="absolute top-8 left-8 z-[1100] flex gap-6 bg-[#0a0a0a]/80 backdrop-blur-xl px-5 py-3 border border-white/5 rounded">
              <div className="flex items-center gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_#1111d4]" aria-hidden />
                <span className="text-[9px] font-bold text-white/40 uppercase tracking-[0.2em]">Filmed Here</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-white/10" aria-hidden />
                <span className="text-[9px] font-bold text-white/40 uppercase tracking-[0.2em]">Region</span>
              </div>
            </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default SelectedMovie;

