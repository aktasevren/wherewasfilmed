'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import L from 'leaflet';
import {
  IconLocationOn,
  IconRefresh,
  IconMovieFilter,
} from '@/app/components/Icons';

import { fetchCountriesGeoJSON, findCountryFeature } from '@/lib/countryGeoJSON';

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
const GeoJSON = dynamic(() => import('react-leaflet').then((mod) => mod.GeoJSON), { ssr: false });
const Circle = dynamic(() => import('react-leaflet').then((mod) => mod.Circle), { ssr: false });

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

// Tahmini süre: kalan lokasyon * ~2.5 sn (gerçekçi bir oran)
const ESTIMATED_SEC_PER_LOCATION = 2.5;

function getLoadingMessage(hasProgress, progressPercent, status, stableTotal, processed) {
  if (!hasProgress || status !== 'running') return 'Preparing your map…';
  if (progressPercent >= 95) return 'Almost there…';
  if (progressPercent >= 80) return 'Just a moment…';
  const remaining = Math.max(0, (stableTotal || 0) - processed);
  const estimatedSec = Math.ceil(remaining * ESTIMATED_SEC_PER_LOCATION);
  if (estimatedSec <= 5) return 'Almost there…';
  if (estimatedSec < 60) return `About ${estimatedSec} seconds left`;
  const mins = Math.ceil(estimatedSec / 60);
  return mins === 1 ? 'About a minute left' : `About ${mins} minutes left`;
}

// Location Loading — sinematik perde + dolan bar, tahmini süre (0/32 yok)
const LocationLoading = ({
  title,
  noLocations,
  redirectCountdown,
  geocodeProgress,
}) => {
  const total = geocodeProgress?.total ?? 0;
  const processed = geocodeProgress?.processed ?? 0;
  const status = geocodeProgress?.status ?? 'idle';

  const stableTotalRef = useRef(0);
  if (total > 0 && total > stableTotalRef.current) stableTotalRef.current = total;
  if (status === 'done') stableTotalRef.current = total;
  const stableTotal = stableTotalRef.current || total;

  const hasProgress = stableTotal > 0;
  const progressPercent = hasProgress
    ? Math.min(100, Math.round((processed / stableTotal) * 100))
    : 0;

  const loadingMessage = getLoadingMessage(hasProgress, progressPercent, status, stableTotal, processed);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden location-loading-screen" aria-busy="true" aria-label="Loading filming locations">
      <div className="location-loading-bg" aria-hidden />
      <div className="location-loading-grain" aria-hidden />

      <div className="curtains fixed inset-0 z-30 flex pointer-events-none">
        <div className="curtain curtain-left" aria-hidden />
        <div className="curtain curtain-right" aria-hidden />
      </div>

      <div className="relative z-20 flex flex-col min-h-screen items-center justify-center px-6 py-24">
        <div className="curtain-content w-full max-w-md flex flex-col items-center gap-12 text-center">
          {noLocations ? (
            <>
              <h1 className="location-loading-title text-xl sm:text-2xl font-semibold text-white tracking-wide">
                No filming locations found
              </h1>
              <p className="text-white/50 text-sm">
                Redirecting in {redirectCountdown ?? 5} second{(redirectCountdown ?? 5) === 1 ? '' : 's'}…
              </p>
            </>
          ) : (
            <>
              <div className="flex flex-col items-center gap-6 curtain-loading-text w-full max-w-sm">
                <p className="location-loading-label text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-400/80">
                  Finding locations
                </p>
                {title && (
                  <h1 className="location-loading-title text-2xl sm:text-3xl font-medium text-white/95 leading-tight text-center line-clamp-3 px-1" title={title}>
                    {title}
                  </h1>
                )}
              </div>
              <div className="w-full max-w-sm mx-auto space-y-4">
                <div className="location-loading-bar-track" role="progressbar" aria-valuenow={hasProgress ? progressPercent : undefined} aria-valuemin={0} aria-valuemax={100} aria-label="Loading progress">
                  <div
                    className={`location-loading-bar-fill ${!hasProgress ? 'location-loading-bar-fill--indeterminate' : ''}`}
                    style={hasProgress ? { width: `${progressPercent}%` } : undefined}
                  />
                </div>
                <p className="location-loading-message text-sm text-white/60">
                  {loadingMessage}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Sınıflandırma: API'den gelen placeType (Geoapify result_type / Nominatim type).
// Ülke: country → turuncu alan, listede yok
// Bölge/il/şehir: state, city, locality, district, county + administrative, province → mavi alan, listede yok
// Spesifik yer: village, suburb, amenity, street vb. → pin + listede göster
const REGION_TYPES = new Set([
  'state', 'county', 'city', 'district', 'locality',
  'administrative', 'region', 'province', 'municipality', 'town',
]);

function isCountryLevel(loc) {
  const pt = String(loc?.placeType ?? '').toLowerCase();
  return pt === 'country';
}

function isRegionLevel(loc) {
  const pt = String(loc?.placeType ?? '').toLowerCase();
  return REGION_TYPES.has(pt);
}

function showInList(loc) {
  return !isCountryLevel(loc) && !isRegionLevel(loc);
}

function SelectedMovie({ onLoadingChange }) {
  const router = useRouter();
  const movieInfos = useSelector((state) => state.MovieReducer.movieInfos);
  const movieDetails = useSelector((state) => state.MovieReducer.movieDetails);
  const noMovie = useSelector((state) => state.MovieReducer.noMovie);
  const geocodeProgress = useSelector((state) => state.MovieReducer.geocodeProgress);

  const [coordinates, setCoordinates] = useState([]);
  const [showMap, setShowMap] = useState(false);
  const [mapResetTrigger, setMapResetTrigger] = useState(0);
  const [flyToLocationIndex, setFlyToLocationIndex] = useState(null);
  const loadingStartTimeRef = useRef(0);
  const minLoadingTime = 10000; // Minimum 10 seconds
  const [redirectCountdown, setRedirectCountdown] = useState(null);
  const containerRef = useRef(null);
  const [countriesGeoJSON, setCountriesGeoJSON] = useState(null);
  useEffect(() => {
    if (!loadingStartTimeRef.current) loadingStartTimeRef.current = Date.now();
  }, []);

  // Film değiştiğinde hemen önceki filmin noktalarını kaldır ve loading göster
  const currentMovieId = movieDetails?.id;
  useEffect(() => {
    if (!currentMovieId) return;
    setCoordinates([]);
    setShowMap(false);
    loadingStartTimeRef.current = Date.now();
  }, [currentMovieId]);

  // movieInfos güncellenince: boşsa loading, doluysa (geocode bittikten sonra) haritayı aç
  useEffect(() => {
    if (movieInfos == null) {
      setCoordinates([]);
      setShowMap(false);
      return;
    }
    if (movieInfos.length === 0) {
      setCoordinates([]);
      setShowMap(noMovie);
      return;
    }
    let cancelled = false;
    async function processLocations() {
      const elapsed = Date.now() - (loadingStartTimeRef.current || Date.now());
      const remainingTime = Math.max(0, minLoadingTime - elapsed);
      await new Promise((resolve) => setTimeout(resolve, remainingTime));
      if (cancelled) return;
      const hasDesc = (loc) => loc.desc && String(loc.desc).trim() !== '' && loc.desc !== 'No description available';
      const sorted = [...movieInfos].sort((a, b) => {
        const aHas = hasDesc(a);
        const bHas = hasDesc(b);
        if (aHas && !bHas) return -1;
        if (!aHas && bHas) return 1;
        return 0;
      });
      setCoordinates(sorted);
      setShowMap(true);
    }
    processLocations();
    return () => { cancelled = true; };
  }, [movieInfos, noMovie, minLoadingTime]);

  const noLocations =
    Boolean(noMovie) || (geocodeProgress?.status === 'done' && (geocodeProgress?.found ?? 0) === 0);

  useEffect(() => {
    onLoadingChange?.(!showMap);
  }, [showMap, onLoadingChange]);

  // Ana ekrana yönlendir: sadece lokasyon gerçekten yoksa (sayı gösterilip sonra state boşalan race’te redirect etmeyelim)
  useEffect(() => {
    if (!showMap) return;
    if (!noLocations) return;
    if (coordinates.length > 0) return; // Zaten haritada lokasyon varsa yönlendirme (ikinci istek state’i boşaltmış olabilir)

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
  }, [showMap, noLocations, coordinates.length, router]);

  const countryLevelLocs = useMemo(
    () => (coordinates || []).filter((loc) => isCountryLevel(loc)),
    [coordinates]
  );
  const regionLevelLocs = useMemo(
    () => (coordinates || []).filter((loc) => isRegionLevel(loc)),
    [coordinates]
  );
  const listItems = useMemo(
    () => coordinates.map((loc, i) => ({ loc, i })).filter(({ loc }) => showInList(loc)),
    [coordinates]
  );

  useEffect(() => {
    if (countryLevelLocs.length === 0) return;
    let cancelled = false;
    fetchCountriesGeoJSON()
      .then((data) => {
        if (!cancelled) setCountriesGeoJSON(data);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [countryLevelLocs.length]);

  const defaultCenter =
    coordinates.length > 0 && coordinates[0].Ycoor && coordinates[0].Xcoor
      ? [coordinates[0].Ycoor, coordinates[0].Xcoor]
      : [55, 60];

  const exactIcon = useMemo(
    () =>
      L.divIcon({
        className: 'map-dot-marker',
        html: '<span class="map-dot"></span>',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14],
      }),
    []
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
          geocodeProgress={geocodeProgress}
        />
      ) : (
        <>
          {/* Film bilgisi: topbar altında, harita alanının üstünde (akışta, harita içinde değil) */}
          <div className="map-screen-film-bar">
            <div className="map-screen-film-bar-inner">
              <div className="map-screen-film-bar-poster">
                {movieDetails?.poster_url ? (
                  <img src={movieDetails.poster_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="map-screen-film-bar-poster-placeholder">
                    <IconMovieFilter size={28} className="text-white/30" />
                    <span className="map-screen-film-bar-poster-placeholder-text">Film</span>
                  </div>
                )}
              </div>
              <div className="map-screen-film-bar-content">
                <p className="map-screen-film-bar-label">Now exploring</p>
                <h2 className="map-screen-film-bar-title">
                  {movieDetails?.title || movieDetails?.original_title || 'Filming Locations'}
                </h2>
                <p className="map-screen-film-bar-meta">
                  {[movieDetails?.wikidataMeta?.year, movieDetails?.wikidataMeta?.duration].filter(Boolean).join(' · ') || '—'}
                </p>
                <p className="map-screen-film-bar-desc">
                  {(movieDetails?.wikidataMeta?.description || movieDetails?.overview) || 'No description available.'}
                </p>
              </div>
            </div>
          </div>

          <div className="map-screen flex flex-1 min-h-0 w-full self-stretch">
          {/* Sidebar */}
          <aside className="map-screen-sidebar map-screen-sidebar--desktop flex flex-col w-full max-w-[380px] flex-shrink-0">
            <div className="map-screen-location-list flex flex-col flex-1 min-h-0">
              <div className="map-screen-location-list-header">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/20 border border-primary/30">
                    <IconLocationOn size={22} className="text-primary" />
                  </div>
                  <div>
                    <h2 className="map-screen-location-list-title">
                      Filming Locations
                    </h2>
                    <p className="map-screen-location-list-subtitle">
                      {listItems.length} location{listItems.length !== 1 ? 's' : ''} · Tap to focus on map
                    </p>
                  </div>
                </div>
              </div>
              <div className="map-screen-location-list-inner">
                {listItems.map(({ loc, i }, listIndex) => {
                  const address = (loc.formatted || loc.place || 'Location').trim() || 'Location';
                  const sceneRaw = loc.desc && loc.desc !== 'No description available' ? loc.desc.trim() : null;
                  const isActive = flyToLocationIndex === i;
                  const numStr = String(listIndex + 1).padStart(2, '0');
                  const sameAsAddress = !sceneRaw || address === sceneRaw || sceneRaw === address || address.includes(sceneRaw) || sceneRaw.includes(address);
                  const showTwoLines = sceneRaw && !sameAsAddress;
                  return (
                    <button
                      type="button"
                      key={`${loc.place}-${i}`}
                      className={`map-screen-location-card ${isActive ? 'map-screen-location-card--active' : ''}`}
                      onClick={() => setFlyToLocationIndex(i)}
                    >
                      <span className="map-screen-location-num" aria-hidden>
                        {numStr}
                      </span>
                      <div className="map-screen-location-content">
                        {showTwoLines && (
                          <span className="map-screen-location-scene">{sceneRaw}</span>
                        )}
                        <span className="map-screen-location-address">{address}</span>
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
                {/* 1) Ülke seviyesi: turuncu alan (GeoJSON), listede yok */}
                {countriesGeoJSON &&
                  countryLevelLocs.map((loc, idx) => {
                    const feature = findCountryFeature(countriesGeoJSON, loc);
                    if (!feature) return null;
                    return (
                      <GeoJSON
                        key={`country-${idx}`}
                        data={feature}
                        style={{
                          fillColor: '#e85d04',
                          fillOpacity: 0.35,
                          color: '#c24e03',
                          weight: 1,
                        }}
                      />
                    );
                  })}
                {/* 2) Bölge/il/şehir: sadece approx area (belli belirsiz daire) */}
                {regionLevelLocs.map((loc, idx) => {
                  const hasCoords = loc?.Ycoor != null && loc?.Xcoor != null;
                  if (!hasCoords) return null;
                  const name = (loc?.formatted || loc?.place || 'This region').trim();
                  return (
                    <Circle
                      key={`region-approx-${idx}`}
                      center={[loc.Ycoor, loc.Xcoor]}
                      radius={35000}
                      pathOptions={{
                        fillColor: '#1e3a8a',
                        fillOpacity: 0.28,
                        color: '#1e40af',
                        weight: 1.5,
                        opacity: 0.6,
                      }}
                    >
                      <Popup className="custom-popup" closeButton>
                        <div className="popup-content">
                          <div className="popup-header">
                            <h3 className="popup-title">{name}</h3>
                          </div>
                          <p className="popup-text text-sm text-neutral-500 mt-1">
                            Filmed somewhere in this area (exact location unknown).
                          </p>
                        </div>
                      </Popup>
                    </Circle>
                  );
                })}
                {/* 3) Spesifik adresler: marker + listede gösterilir */}
                {coordinates.map((elem, index) => {
                  if (!showInList(elem)) return null;
                  const hasPoint = elem != null && elem.Ycoor != null && elem.Xcoor != null;
                  if (!hasPoint) return null;
                  const title = elem.formatted || elem.place;
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
              </MapContainer>
                </div>

                {/* Üst orta: Reset Map — belirgin ve ortada */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1101] hidden md:block">
                  <button
                    type="button"
                    className="map-reset-button rounded-full px-6 py-3 flex items-center gap-2.5 text-base font-bold text-white hover:border-primary/50 shadow-lg transition-all pointer-events-auto"
                    onClick={() => setMapResetTrigger((t) => t + 1)}
                  >
                    <IconRefresh size={20} />
                    Reset Map
                  </button>
                </div>
                {/* Sağ üst: Kompakt lejand — alan vs tam nokta */}
                <div className="map-screen-legend absolute top-6 right-6 z-[1101] hidden md:flex flex-wrap items-center gap-x-2 gap-y-1">
                  <div className="map-screen-legend-dot" aria-hidden title="Exact filming location">
                    <span className="map-screen-legend-dot-inner" />
                  </div>
                  <span className="map-screen-legend-label">Exact spot</span>
                  <div className="map-screen-legend-sep" aria-hidden />
                  <div className="map-screen-legend-area map-screen-legend-area--orange" aria-hidden title="Filmed in this country" />
                  <span className="map-screen-legend-label">Country</span>
                  <div className="map-screen-legend-sep" aria-hidden />
                  <div className="map-screen-legend-approx" aria-hidden title="Filmed somewhere in this area (no exact location)" />
                  <span className="map-screen-legend-label">Approx. area</span>
                </div>
              </div>
            </div>
          </section>
          </div>
        </>
      )}
    </div>
  );
}

export default SelectedMovie;

