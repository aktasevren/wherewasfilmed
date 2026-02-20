/**
 * Ülke GeoJSON yükleme ve lokasyon adına göre feature eşleme.
 * Natural Earth 110m admin-0 countries kullanılıyor.
 */

const COUNTRIES_GEOJSON_URL =
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson';

/** Yaygın kısa ad → resmi isim (Natural Earth NAME alanına göre) */
const COUNTRY_ALIASES = {
  usa: 'United States of America',
  'united states': 'United States of America',
  'u.s.a.': 'United States of America',
  uk: 'United Kingdom',
  'united kingdom': 'United Kingdom',
  uae: 'United Arab Emirates',
  'united arab emirates': 'United Arab Emirates',
  drc: 'Democratic Republic of the Congo',
  congo: 'Democratic Republic of the Congo',
  rov: 'Republic of Vietnam',
  ussr: 'Russia', // historical
  russia: 'Russia',
};

let cachedGeoJSON = null;

/**
 * @returns {Promise<GeoJSON.FeatureCollection>}
 */
export async function fetchCountriesGeoJSON() {
  if (cachedGeoJSON) return cachedGeoJSON;
  const res = await fetch(COUNTRIES_GEOJSON_URL);
  if (!res.ok) throw new Error('Failed to fetch countries GeoJSON');
  const data = await res.json();
  cachedGeoJSON = data;
  return data;
}

/**
 * Lokasyon metninden (formatted / place) ülke adını normalize eder.
 * @param {string} text - örn. "USA", "United States of America"
 * @returns {string} normalize edilmiş arama metni
 */
function normalizeCountryQuery(text) {
  if (!text || typeof text !== 'string') return '';
  const t = text.trim().toLowerCase();
  return COUNTRY_ALIASES[t] || t;
}

/**
 * GeoJSON feature'ın NAME değeri ile eşleşiyor mu?
 * @param {string} locationName - lokasyon formatted/place
 * @param {string} featureName - properties.NAME
 */
function nameMatches(locationName, featureName) {
  if (!featureName) return false;
  const q = normalizeCountryQuery(locationName);
  const f = featureName.trim().toLowerCase();
  if (q === f) return true;
  if (f.includes(q) || q.includes(f)) return true;
  // "USA" vs "United States of America"
  const alias = COUNTRY_ALIASES[q];
  if (alias && alias.toLowerCase() === f) return true;
  return false;
}

/**
 * Ülke seviyesi lokasyon için GeoJSON feature bulur.
 * @param {GeoJSON.FeatureCollection} geojson
 * @param {{ formatted?: string, place?: string }} location
 * @returns {GeoJSON.Feature | null}
 */
export function findCountryFeature(geojson, location) {
  const name = (location.formatted || location.place || '').trim();
  if (!name || !geojson?.features) return null;
  const q = normalizeCountryQuery(name);
  for (const feature of geojson.features) {
    const props = feature.properties || {};
    const featureName = props.NAME || props.name || props.ADMIN || '';
    if (nameMatches(name, featureName)) return feature;
  }
  // Birebir bulunamadıysa "United States" gibi kısmi eşleşme
  for (const feature of geojson.features) {
    const props = feature.properties || {};
    const featureName = props.NAME || props.name || props.ADMIN || '';
    if (featureName.toLowerCase().includes(q) || q.includes(featureName.toLowerCase())) return feature;
  }
  return null;
}
