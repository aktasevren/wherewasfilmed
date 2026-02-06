/**
 * Shared Wikidata helpers for API routes (search-suggestions, locations).
 * Keeps claim parsing, Commons image URLs, and year/duration logic in one place.
 */

export const WIKIMEDIA_HEADERS = {
  'User-Agent': 'where-was-filmed/1.0 (local dev)',
  'Api-User-Agent': 'where-was-filmed/1.0 (local dev)',
  Accept: 'application/json',
};

export function pickFirstClaimValue(entity, prop) {
  const claim = entity?.claims?.[prop]?.[0];
  return claim?.mainsnak?.datavalue?.value ?? null;
}

export function hasInstanceOf(entity, qid, instanceOfProp = 'P31') {
  const claims = entity?.claims?.[instanceOfProp];
  if (!Array.isArray(claims) || claims.length === 0) return false;
  return claims.some((c) => c?.mainsnak?.datavalue?.value?.id === qid);
}

/** Parse Wikidata time value to year number (e.g. "+1977-05-25T00:00:00Z" → 1977). */
export function parseWikidataYear(timeValue) {
  const t = timeValue?.time;
  if (typeof t !== 'string') return null;
  const m = t.match(/([+-]\d{4})-/);
  return m ? Number(m[1]) : null;
}

/** Build Commons Special:FilePath URL for an image filename. */
export function commonsImageUrl(fileName, width = 200) {
  if (!fileName || typeof fileName !== 'string') return null;
  const normalized = String(fileName).replace(/ /g, '_');
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(normalized)}?width=${width}`;
}

/** Format Wikidata quantity (e.g. duration in seconds) as "X min" or "X h Y min". */
export function formatDuration(quantityValue) {
  if (!quantityValue) return null;
  const amount = quantityValue.amount;
  const num = typeof amount === 'string' ? parseInt(amount.replace(/^\+/, ''), 10) : Number(amount);
  if (!Number.isFinite(num) || num < 0) return null;
  if (num < 60) return `${num} min`;
  const mins = Math.floor(num / 60);
  const secs = num % 60;
  if (mins < 60) return secs > 0 ? `${mins} min ${secs} s` : `${mins} min`;
  const hours = Math.floor(mins / 60);
  const remainMins = mins % 60;
  if (remainMins === 0) return `${hours} h`;
  return `${hours} h ${remainMins} min`;
}

export function isWikidataId(id) {
  return typeof id === 'string' && /^Q\d+$/i.test(id.trim());
}
