/**
 * PostgreSQL bağlantısı — geocoded_locations ve movie_titles tabloları için.
 * .env.local'da GEOCODED_DATABASE_URL veya DATABASE_URL (osm-geocoder ile aynı) tanımlı olmalı.
 */

const GEOCODED_TABLE = 'public.geocoded_locations';
const MOVIE_TITLES_TABLE = 'public.movie_titles';
const TABLE = GEOCODED_TABLE;

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
       FROM ${GEOCODED_TABLE}
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

/**
 * Film adına göre movie_titles tablosunda arama (diyagram: DB imdb_dataset title).
 * Canlı ortamda sadece movie_titles tablosu kullanılabilir.
 * @param {string} query - Arama metni (primary_title ILIKE)
 * @param {number} limit - Maksimum sonuç (varsayılan 20)
 * @returns {Promise<Array<{ tconst, primary_title, original_title, start_year }>>}
 */
export async function getMovieTitlesByQuery(query, limit = 20) {
  const DATABASE_URL = process.env.GEOCODED_DATABASE_URL || process.env.DATABASE_URL;
  if (!DATABASE_URL || typeof query !== 'string' || !query.trim()) {
    if (process.env.NODE_ENV === 'development' && typeof query === 'string' && query.trim()) {
      console.warn('[pg] getMovieTitlesByQuery: DATABASE_URL / GEOCODED_DATABASE_URL tanımlı değil');
    }
    return [];
  }

  const safeLimit = Math.max(1, Math.min(50, Number(limit) || 20));
  const escaped = query.trim().replace(/[%_\\]/g, (c) => (c === '\\' ? '\\\\' : '\\' + c));
  const searchTerm = `%${escaped}%`;

  let pg;
  try {
    pg = (await import('pg')).default;
  } catch (e) {
    if (process.env.NODE_ENV === 'development') console.warn('[pg] getMovieTitlesByQuery: pg modülü yok');
    return [];
  }
  const pool = new pg.Pool({ connectionString: DATABASE_URL });

  try {
    const res = await pool.query(
      `SELECT tconst, primary_title, original_title, start_year
       FROM ${MOVIE_TITLES_TABLE}
       WHERE primary_title ILIKE $1
       ORDER BY num_votes DESC NULLS LAST, average_rating DESC NULLS LAST, start_year DESC NULLS LAST
       LIMIT $2`,
      [searchTerm, safeLimit]
    );
    return res.rows ?? [];
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[pg] getMovieTitlesByQuery failed:', err.message);
    }
    return [];
  } finally {
    await pool.end();
  }
}
