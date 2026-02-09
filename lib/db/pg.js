/**
 * PostgreSQL bağlantısı — geocoded_locations tablosunu okumak için.
 * .env.local'da GEOCODED_DATABASE_URL veya DATABASE_URL (osm-geocoder ile aynı) tanımlı olmalı.
 */

const TABLE = 'public.geocoded_locations';

/**
 * Belirtilen imdb_id için geocoded_locations tablosundan koordinatlı lokasyonları döner.
 * @param {string} imdbId - tt... formatında IMDb ID
 * @returns {Promise<Array<{ place, desc, Xcoor, Ycoor, bbox, placeType, formatted }> | null>}
 *   Bulunursa frontend ile uyumlu dizi, yoksa veya DB yoksa null.
 */
export async function getGeocodedLocations(imdbId) {
  const DATABASE_URL = process.env.GEOCODED_DATABASE_URL || process.env.DATABASE_URL;
  if (!DATABASE_URL || typeof imdbId !== 'string' || !/^tt\d+$/.test(imdbId)) {
    if (process.env.NODE_ENV === 'development' && typeof imdbId === 'string' && /^tt\d+$/.test(imdbId)) {
      console.warn('[pg] getGeocodedLocations: GEOCODED_DATABASE_URL/DATABASE_URL tanımlı değil');
    }
    return null;
  }

  let pg;
  try {
    pg = (await import('pg')).default;
  } catch (e) {
    console.warn('pg module not available:', e.message);
    return null;
  }
  const pool = new pg.Pool({ connectionString: DATABASE_URL });

  try {
    const res = await pool.query(
      `SELECT location_value, description, lon, lat, bbox, place_type, formatted_address
       FROM ${TABLE}
       WHERE imdb_id = $1 AND lat IS NOT NULL AND lon IS NOT NULL
       ORDER BY id`,
      [imdbId]
    );

    if (!res.rows?.length) return null;

    return res.rows.map((r) => {
      let bbox = null;
      if (Array.isArray(r.bbox) && r.bbox.length >= 4) bbox = r.bbox;
      else if (r.bbox && typeof r.bbox === 'object') bbox = Object.values(r.bbox);
      return {
        place: r.location_value || '',
        desc: r.description || 'No description available',
        Xcoor: r.lon,
        Ycoor: r.lat,
        bbox,
        placeType: r.place_type || null,
        formatted: r.formatted_address || r.location_value || '',
      };
    });
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[pg] getGeocodedLocations failed:', err.message);
    }
    return null;
  } finally {
    await pool.end();
  }
}
