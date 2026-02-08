/**
 * Encode/decode movie IDs for URLs. Hides raw IMDb (tt...) and Wikidata (Q...) IDs
 * in the address bar; resolution is done server-side (e.g. via Wikidata).
 * Uses URL-safe base64 so links are stable and reversible without secrets.
 */

function base64urlEncode(str) {
  if (typeof Buffer !== 'undefined') {
    const b64 = Buffer.from(str, 'utf8').toString('base64');
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  const base64 = btoa(unescape(encodeURIComponent(str)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(encoded) {
  if (typeof encoded !== 'string' || !encoded.trim()) return '';
  let b64 = encoded.trim().replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4;
  if (pad) b64 += '='.repeat(4 - pad);
  try {
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(b64, 'base64').toString('utf8');
    }
    return decodeURIComponent(escape(atob(b64)));
  } catch {
    return '';
  }
}

/**
 * Encode a movie id (tt..., Q..., etc.) for use in /movie/[id] URLs.
 * @param {string} id - Raw id (e.g. tt0120737 or Q21116)
 * @returns {string} Encoded string for the URL path
 */
export function encodeMovieId(id) {
  if (id == null || typeof id !== 'string') return '';
  const s = String(id).trim();
  if (!s) return '';
  return base64urlEncode(s);
}

/**
 * Decode a movie id from a URL path segment back to the raw id.
 * @param {string} encoded - Value from the URL (e.g. from params.id)
 * @returns {string} Raw id (tt... or Q...) or empty string if invalid
 */
export function decodeMovieId(encoded) {
  if (encoded == null || typeof encoded !== 'string') return '';
  const s = String(encoded).trim();
  if (!s) return '';
  return base64urlDecode(s);
}
