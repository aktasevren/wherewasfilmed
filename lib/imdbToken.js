/**
 * IMDb ID token helpers. Used ONLY for the filming-locations flow:
 * - Locations API needs tt1234567-style ID to call the locations backend (GraphQL).
 * - Token avoids exposing raw IMDb IDs in URLs; decode on server only.
 * - Search/suggestions use Wikidata only; no IMDb API or SUGGESTION_SERVICE is used.
 */
import crypto from 'crypto';

const TOKEN_VERSION = 'v1';

function base64urlEncode(input) {
  return Buffer.from(input).toString('base64url');
}

function base64urlDecodeToString(input) {
  return Buffer.from(input, 'base64url').toString('utf8');
}

function getSecret() {
  return process.env.IMDB_TOKEN_SECRET || process.env.NEXTAUTH_SECRET || '';
}

export function createImdbToken(imdbId, ttlSeconds = 60 * 30) {
  if (!imdbId || typeof imdbId !== 'string') return null;
  const secret = getSecret();
  if (!secret) return null;

  const now = Math.floor(Date.now() / 1000);
  // Stabil token: aynı imdbId aynı time-bucket içinde aynı token üretir.
  const bucketSize = Math.max(60, Number(ttlSeconds) || 1800); // en az 60s
  const bucket = Math.floor(now / bucketSize);
  const exp = (bucket + 1) * bucketSize;
  const payload = {
    v: TOKEN_VERSION,
    imdbId,
    exp,
  };

  const payloadB64 = base64urlEncode(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');
  return `${payloadB64}.${sig}`;
}

export function verifyImdbToken(token) {
  const secret = getSecret();
  if (!secret || !token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, sig] = parts;
  if (!payloadB64 || !sig) return null;

  const expectedSig = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');
  try {
    const a = Buffer.from(expectedSig);
    const b = Buffer.from(sig);
    if (a.length !== b.length) return null;
    if (!crypto.timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  let payload;
  try {
    payload = JSON.parse(base64urlDecodeToString(payloadB64));
  } catch {
    return null;
  }

  if (payload?.v !== TOKEN_VERSION) return null;
  const imdbId = payload?.imdbId;
  const exp = payload?.exp;
  if (typeof imdbId !== 'string' || !/^tt\d+$/.test(imdbId)) return null;
  if (typeof exp !== 'number') return null;

  const now = Math.floor(Date.now() / 1000);
  if (now > exp) return null;

  return { imdbId, exp };
}

