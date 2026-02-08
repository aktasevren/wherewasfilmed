/**
 * Generate metadata for movie pages. Fetches movie title from Wikidata for dynamic SEO.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://where-was-filmed.vercel.app';
const WIKIMEDIA_HEADERS = {
  'User-Agent': 'WhereWasFilmed/1.0 (https://where-was-filmed.vercel.app; contact for crawlers)',
  Accept: 'application/json',
};

/** Get English label for a Wikidata entity (Q ID). */
async function fetchTitleByWikidataId(qid) {
  if (!qid || !/^Q\d+$/i.test(String(qid).trim())) return null;
  try {
    const res = await fetch(
      `https://www.wikidata.org/wiki/Special:EntityData/${encodeURIComponent(String(qid).trim())}.json`,
      { headers: WIKIMEDIA_HEADERS, signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const entities = data?.entities;
    const key = Object.keys(entities || {}).find((k) => k.toUpperCase() === String(qid).trim().toUpperCase());
    const entity = key ? entities[key] : null;
    return entity?.labels?.en?.value ?? null;
  } catch {
    return null;
  }
}

/** Get English title for an IMDb ID (tt...) via Wikidata SPARQL. */
async function fetchTitleByImdbId(imdbId) {
  if (!imdbId || !/^tt\d+$/i.test(String(imdbId).trim())) return null;
  const query = encodeURIComponent(
    `SELECT ?label WHERE { ?item wdt:P345 "${String(imdbId).trim()}". ?item rdfs:label ?label. FILTER(LANG(?label) = "en") } LIMIT 1`
  );
  try {
    const res = await fetch(
      `https://query.wikidata.org/sparql?query=${query}&format=json`,
      { headers: WIKIMEDIA_HEADERS, signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const bindings = data?.results?.bindings;
    if (Array.isArray(bindings) && bindings[0]?.label?.value) return bindings[0].label.value;
    return null;
  } catch {
    return null;
  }
}

/** Resolve movie title from movieId (Q or tt). */
async function getMovieTitle(movieId) {
  if (!movieId || typeof movieId !== 'string') return null;
  const id = movieId.trim();
  if (/^Q\d+$/i.test(id)) return fetchTitleByWikidataId(id);
  if (/^tt\d+$/i.test(id)) return fetchTitleByImdbId(id);
  return null;
}

export async function generateMovieMetadata(movieId) {
  const siteUrl = SITE_URL;
  const defaultTitle = 'Filming Locations';
  const defaultDescription =
    'Discover where your favorite movies and series were filmed. Find every filming location on an interactive map.';

  try {
    const movieTitle = await getMovieTitle(movieId);
    const title = movieTitle
      ? `${movieTitle} Filming Locations`
      : defaultTitle;
    const description = movieTitle
      ? `Discover where ${movieTitle} was filmed. See all filming locations on an interactive map — explore where every scene was shot.`
      : defaultDescription;
    const imageUrl = `${siteUrl}/assets/film.png`;
    const canonicalUrl = `${siteUrl}/movie/${encodeURIComponent(movieId)}`;
    const keywords = [
      movieTitle ? `${movieTitle} filming locations` : 'filming locations',
      'movie filming locations',
      'where was it filmed',
      'filming locations map',
      'film locations',
      'location finder',
    ].filter(Boolean);

    return {
      title,
      description: description.substring(0, 160),
      keywords,
      openGraph: {
        title: `${title} | Where Was Filmed`,
        description: description.substring(0, 200),
        url: canonicalUrl,
        siteName: 'Where Was Filmed',
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: movieTitle ? `${movieTitle} - Filming Locations Map` : 'Filming Locations',
          },
        ],
        type: 'website',
        locale: 'en_US',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${title} | Where Was Filmed`,
        description: description.substring(0, 200),
        images: [imageUrl],
      },
      alternates: {
        canonical: canonicalUrl,
      },
      robots: {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true },
      },
    };
  } catch (error) {
    console.error('Error generating movie metadata:', error);
    return {
      title: defaultTitle,
      description: defaultDescription,
      alternates: {
        canonical: movieId ? `${siteUrl}/movie/${encodeURIComponent(movieId)}` : siteUrl,
      },
    };
  }
}
