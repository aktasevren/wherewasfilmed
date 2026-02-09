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
  IconMovieFilter,
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
            (coord) => coord != null && coord.Ycoor != null && coord.Xcoor != null
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
            (c) => c != null && c.Ycoor != null && c.Xcoor != null
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

// Harita container boyutu değişince Leaflet'in invalidateSize ile güncellemesi (mobil dahil)
// Viewport'a girdiğinde invalidateSize (mobilde aşağıda kalan harita siyah kalmasın)
const MapResize = dynamic(
  () =>
    import('react-leaflet').then((mod) => {
      function MapResize() {
        const map = mod.useMap();

        useEffect(() => {
          const run = () => {
            try {
              map.invalidateSize();
            } catch (e) {}
          };
          // İlk çalıştırma: layout tamamlansın diye RAF + kısa gecikmeler (mobil siyah ekran fix)
          const raf = typeof requestAnimationFrame !== 'undefined'
            ? requestAnimationFrame(() => run())
            : null;
          const t1 = setTimeout(run, 50);
          const t2 = setTimeout(run, 200);
          const t3 = setTimeout(run, 500);
          const t4 = setTimeout(run, 1000);

          const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;
          const timeouts = [t1, t2, t3, t4];
          if (isMobile) {
            timeouts.push(setTimeout(run, 1500));
            timeouts.push(setTimeout(run, 2500));
          }

          const container = map.getContainer();
          if (container && typeof ResizeObserver !== 'undefined') {
            const ro = new ResizeObserver(() => run());
            ro.observe(container);
            if (typeof IntersectionObserver !== 'undefined') {
              // Mobilde harita viewport'a girer girmez invalidateSize (threshold düşük)
              const io = new IntersectionObserver(
                (entries) => {
                  if (entries[0]?.isIntersecting) {
                    run();
                    if (isMobile) setTimeout(run, 100);
                  }
                },
                { root: null, rootMargin: '20px', threshold: 0.01 }
              );
              io.observe(container);
              return () => {
                if (raf && typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(raf);
                timeouts.forEach(clearTimeout);
                ro.disconnect();
                io.disconnect();
              };
            }
            return () => {
              if (raf && typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(raf);
              timeouts.forEach(clearTimeout);
              ro.disconnect();
            };
          }
          return () => {
            if (raf && typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(raf);
            timeouts.forEach(clearTimeout);
          };
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
  const movieInfos = useSelector((state) => state.MovieReducer.movieInfos);
  const movieDetails = useSelector((state) => state.MovieReducer.movieDetails);
  const noMovie = useSelector((state) => state.MovieReducer.noMovie);
  const geocodeProgress = useSelector((state) => state.MovieReducer.geocodeProgress);
  const locationsSource = useSelector((state) => state.MovieReducer.locationsSource);

  const [coordinates, setCoordinates] = useState([]);
  const [showMap, setShowMap] = useState(false);
  const [mapResetTrigger, setMapResetTrigger] = useState(0);
  const [flyToLocationIndex, setFlyToLocationIndex] = useState(null);
  const loadingStartTimeRef = useRef(0);
  const minLoadingTime = 10000; // Minimum 10 seconds
  const [redirectCountdown, setRedirectCountdown] = useState(null);
  const containerRef = useRef(null);
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
          <aside className="map-screen-sidebar map-screen-sidebar--desktop flex flex-col w-full max-w-[380px] flex-shrink-0">
            <div className="map-screen-featured p-8 border-b border-white/5">
              <div className="flex items-center gap-2 mb-6">
                <IconMovieFilter className="text-primary" size={20} />
                <span className="text-xs uppercase tracking-widest font-semibold text-primary/80">Cinematic Explorer</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold leading-tight text-white mb-4 tracking-tight">
                {movieDetails?.title || movieDetails?.original_title || 'Filming Locations'}
              </h1>
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary text-white text-sm font-medium mb-6">
                {[movieDetails?.wikidataMeta?.year, movieDetails?.wikidataMeta?.duration].filter(Boolean).join(' • ') || '—'}
              </div>
              <div className="pl-4 border-l-4 border-primary">
                <p className="text-gray-400 text-sm leading-relaxed">
                  {(movieDetails?.wikidataMeta?.description || movieDetails?.overview) || 'No description available.'}
                </p>
              </div>
            </div>

            <div className="map-screen-location-list flex flex-col">
              <div className="map-screen-location-list-header px-4 sm:px-5 pt-4 pb-3 border-b border-white/5">
                <div className="map-screen-location-list-title text-sm font-semibold uppercase tracking-wider text-white/90">
                  Filming Locations <span className="text-primary/70 font-bold normal-case ml-1">({coordinates.length})</span>
                </div>
                <p className="text-xs text-white/50 mt-1">Tap a location to focus on map</p>
              </div>
              <div className="map-screen-location-list-inner px-3 sm:px-4 pb-6 space-y-3">
                {coordinates.map((loc, index) => {
                  const locationLine = (loc.formatted || loc.place || 'Location').trim() || 'Location';
                  const desc = loc.desc && loc.desc !== 'No description available' ? loc.desc : null;
                  const isActive = flyToLocationIndex === index;
                  const numStr = String(index + 1).padStart(2, '0');
                  return (
                    <button
                      type="button"
                      key={`${loc.place}-${index}`}
                      className={`map-screen-location-card group cursor-pointer w-full text-left rounded-xl border transition-all duration-200 flex gap-3 p-3 sm:p-3.5 touch-manipulation relative overflow-hidden ${
                        isActive
                          ? 'bg-primary/20 border-primary active-card-glow'
                          : 'bg-white/5 border-white/10 hover:border-primary/50 active:bg-primary/10'
                      }`}
                      onClick={() => setFlyToLocationIndex(index)}
                    >
                      {isActive && <div className="absolute inset-0 bg-primary/5" aria-hidden />}
                      <span
                        className={`relative z-10 flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold border transition-colors map-screen-location-num ${
                          isActive
                            ? 'bg-primary border-primary text-white shadow-md'
                            : 'bg-amber-500/20 border-amber-500/50 text-amber-400 group-hover:bg-amber-500/30 group-hover:border-amber-400/60'
                        }`}
                        aria-hidden
                      >
                        {numStr}
                      </span>
                      <div className="relative z-10 flex-1 min-w-0 flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-white leading-snug line-clamp-2">
                          {locationLine}
                        </span>
                        {desc && (
                          <p className="text-xs italic text-amber-accent/80 leading-snug line-clamp-2">
                            {desc}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          </aside>

          {/* Harita: mobilde tam ekran, masaüstünde sidebar yanında */}
          <section className="map-screen-map relative flex-1 min-w-0">
            <div className="map-screen-map-sticky relative z-0">
              <div className="map-screen-map-inner">
                <div className="map-screen-map-box">
                <MapContainer
                  center={defaultCenter}
                  zoom={5}
                  minZoom={0}
                  maxZoom={12}
                  scrollWheelZoom
                  className="map-screen-leaflet"
                  whenReady={(map) => {
                    setTimeout(() => { try { map.invalidateSize(); } catch (_) {} }, 100);
                    setTimeout(() => { try { map.invalidateSize(); } catch (_) {} }, 400);
                  }}
                >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapResize />
                <FitBounds coordinates={coordinates} />
                <MapResetControl coordinates={coordinates} resetTrigger={mapResetTrigger} />
                <MapFlyToLocation coordinates={coordinates} flyToIndex={flyToLocationIndex} />
                <MarkerClusterGroup chunkedLoading>
                {coordinates.map((elem, index) => {
                  const hasPoint = elem != null && elem.Ycoor != null && elem.Xcoor != null;
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

                {/* Overlay ve kontroller: sadece masaüstünde (mobilde sadece harita) */}
                <div className="map-screen-overlays absolute inset-0 z-[1100] pointer-events-none hidden md:block">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/35 to-transparent" />
                </div>
                <div className="map-screen-controls absolute top-6 left-1/2 -translate-x-1/2 z-[1101] hidden md:block">
                  <div className="glass-pill rounded-full px-6 py-3 flex items-center gap-6 shadow-2xl">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" aria-hidden />
                      <span className="text-sm font-medium tracking-wide text-white/90">
                        Exploring: <span className="text-white font-semibold">{movieDetails?.title || movieDetails?.original_title || 'Filming Locations'}</span>
                      </span>
                    </div>
                    <div className="h-4 w-px bg-white/20" aria-hidden />
                    <button
                      type="button"
                      className="flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-primary transition-colors pointer-events-auto"
                      onClick={() => setMapResetTrigger((t) => t + 1)}
                    >
                      <IconRefresh size={18} />
                      Reset Map
                    </button>
                  </div>
                </div>
                {/* Database Status badge (mockup: glass-pill) */}
                {locationsSource && (
                  <div className="map-screen-source absolute top-6 right-6 z-[1101] glass-pill px-4 py-2 rounded-full flex items-center gap-2 hidden md:flex">
                    <span className="text-[10px] uppercase font-bold tracking-tighter text-white/40">Database Status</span>
                    <span className="text-[10px] uppercase font-bold tracking-tighter text-primary">Source: {locationsSource === 'db' ? 'DB' : 'Web'}</span>
                  </div>
                )}
                <div className="map-screen-legend absolute top-6 left-6 z-[1101] glass-pill px-4 py-4 rounded-xl flex flex-col gap-3 hidden md:flex">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-primary pin-glow" aria-hidden />
                    <span className="text-xs font-medium text-white/80">Filmed Here</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full border border-primary bg-primary/20" aria-hidden />
                    <span className="text-xs font-medium text-white/80">Region Highlight</span>
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

