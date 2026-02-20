/**
 * Bölge (eyalet/il) GeoJSON — Natural Earth 110m admin-1 states/provinces.
 * Ülke sınırları countryGeoJSON (admin-0), bölge sınırları bu dosya.
 */

const REGIONS_GEOJSON_URL =
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_1_states_provinces.geojson';

let cachedGeoJSON = null;

/**
 * @returns {Promise<GeoJSON.FeatureCollection>}
 */
export async function fetchRegionsGeoJSON() {
  if (cachedGeoJSON) return cachedGeoJSON;
  const res = await fetch(REGIONS_GEOJSON_URL);
  if (!res.ok) throw new Error('Failed to fetch regions GeoJSON');
  const data = await res.json();
  cachedGeoJSON = data;
  return data;
}

function normalizeQuery(text) {
  if (!text || typeof text !== 'string') return '';
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Bölge seviyesi lokasyon için GeoJSON feature bulur (name / name_en / admin ile eşleşme).
 * @param {GeoJSON.FeatureCollection} geojson
 * @param {{ formatted?: string, place?: string }} location
 * @returns {GeoJSON.Feature | null}
 */
export function findRegionFeature(geojson, location) {
  const name = (location.formatted || location.place || '').trim();
  if (!name || !geojson?.features) return null;
  const q = normalizeQuery(name);
  if (!q) return null;

  for (const feature of geojson.features) {
    const props = feature.properties || {};
    const featureName = (props.name || props.name_en || props.NAME || '').trim().toLowerCase();
    if (!featureName) continue;
    if (featureName === q) return feature;
    if (featureName.includes(q) || q.includes(featureName)) return feature;
  }
  return null;
}
