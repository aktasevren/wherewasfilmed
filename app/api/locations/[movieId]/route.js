/**
 * Filming locations API.
 * 1) Önce geocoded_locations tablosunda bu film (imdb_id) var mı diye bakar; varsa koordinatlı lokasyonları döner (Geoapify/IMDb atlanır).
 * 2) Yoksa IMDb GraphQL ile lokasyonları alır (client tarafında Geoapify ile geocode edilir).
 */
import { NextResponse } from 'next/server';
import axios from 'axios';
import { verifyImdbToken } from '@/lib/imdbToken';
import { decodeMovieId } from '@/lib/movieId';
import { getGeocodedLocations } from '@/lib/db/pg';
import {
  pickFirstClaimValue,
  commonsImageUrl,
  formatDuration,
  parseWikidataYear,
  isWikidataId,
  WIKIMEDIA_HEADERS,
} from '@/lib/wikidata';

const LOCATIONS_SERVICE_BASE_URL = process.env.LOCATIONS_SERVICE_BASE_URL;
const WIKIDATA_ENTITY_DATA_BASE = 'https://www.wikidata.org/wiki/Special:EntityData';
const IMDB_PROPERTY = 'P345';
const IMAGE_PROPERTY = 'P18';
const LOGO_PROPERTY = 'P154';
const DURATION_PROPERTY = 'P2047';
const PUBLICATION_DATE_PROPERTY = 'P577';

function buildWikidataMeta(entity) {
  if (!entity || typeof entity !== 'object') return null;
  const description = entity.descriptions?.en?.value ?? null;
  const imageRaw = pickFirstClaimValue(entity, IMAGE_PROPERTY);
  const logo = imageRaw ? commonsImageUrl(imageRaw, 480) : null;
  const logoIconRaw = pickFirstClaimValue(entity, LOGO_PROPERTY);
  const logoIcon = logoIconRaw ? commonsImageUrl(logoIconRaw, 80) : null;
  const durationRaw = pickFirstClaimValue(entity, DURATION_PROPERTY);
  const duration = durationRaw ? formatDuration(durationRaw) : null;
  const dateRaw = pickFirstClaimValue(entity, PUBLICATION_DATE_PROPERTY);
  const year = dateRaw ? parseWikidataYear(dateRaw) : null;
  if (!logo && !logoIcon && !duration && !description && year == null) return null;
  return {
    ...(logo && { logo }),
    ...(logoIcon && { logoIcon }),
    ...(duration && { duration }),
    ...(description && { description }),
    ...(year != null && { year }),
  };
}

async function fetchWikidataEntity(wikidataId) {
  const url = `${WIKIDATA_ENTITY_DATA_BASE}/${encodeURIComponent(wikidataId.trim())}.json`;
  const res = await axios.get(url, {
    headers: WIKIMEDIA_HEADERS,
    timeout: 10000,
  });
  const entities = res.data?.entities;
  if (!entities || typeof entities !== 'object') return null;
  return entities[wikidataId] ?? entities[wikidataId.toUpperCase()] ?? null;
}

function getImdbIdFromEntity(entity) {
  if (!entity?.claims?.[IMDB_PROPERTY]?.length) return null;
  const value = entity.claims[IMDB_PROPERTY][0]?.mainsnak?.datavalue?.value;
  if (typeof value !== 'string' || !/^tt\d+$/.test(value)) return null;
  return value;
}

/** Wikidata entity'den İngilizce başlık (label). */
function getTitleFromEntity(entity) {
  if (!entity || typeof entity !== 'object') return null;
  return entity.labels?.en?.value ?? null;
}

/** IMDb ID (tt...) ile Wikidata SPARQL'den İngilizce film başlığını al. */
async function fetchTitleByImdbId(imdbId) {
  if (typeof imdbId !== 'string' || !/^tt\d+$/.test(imdbId)) return null;
  const query = encodeURIComponent(
    `SELECT ?label WHERE { ?item wdt:P345 "${imdbId}". ?item rdfs:label ?label. FILTER(LANG(?label) = "en") } LIMIT 1`
  );
  try {
    const res = await axios.get(
      `https://query.wikidata.org/sparql?query=${query}&format=json`,
      { headers: WIKIMEDIA_HEADERS, timeout: 8000 }
    );
    const bindings = res.data?.results?.bindings;
    if (Array.isArray(bindings) && bindings[0]?.label?.value) {
      return bindings[0].label.value;
    }
    return null;
  } catch (err) {
    console.warn('Wikidata title fetch failed for', imdbId, err.message);
    return null;
  }
}

function buildLocationsServiceUrl(titleRef) {
  if (!LOCATIONS_SERVICE_BASE_URL) return null;
  const operation = 'TitleFilmingLocationsPaginated';
  const afterToken = 'bGMwMjkwODcz';
  const hash = '9f2ac963d99baf72b7a108de141901f4caa8c03af2e1a08dfade64db843eff7b';
  const variables = {
    after: afterToken,
    const: titleRef,
    first: 50,
    isAutoTranslationEnabled: false,
    locale: 'en-US',
    originalTitleText: false,
  };
  const extensions = {
    persistedQuery: { sha256Hash: hash, version: 1 },
  };
  const params = new URLSearchParams({
    operationName: operation,
    variables: JSON.stringify(variables),
    extensions: JSON.stringify(extensions),
  });
  return `${LOCATIONS_SERVICE_BASE_URL}/?${params.toString()}`;
}

export async function GET(request, { params }) {
  const start = performance.now();
  const { movieId } = await params;

  try {
    if (typeof movieId !== 'string' || !movieId) {
      return NextResponse.json({
        locations: 'location not found',
      });
    }

    const rawId = decodeMovieId(movieId) || movieId;

    let titleRef;
    let wikidataMeta = null;
    let entity = null;
    if (isWikidataId(rawId)) {
      try {
        entity = await fetchWikidataEntity(rawId);
        if (!entity) {
          return NextResponse.json({ locations: 'location not found' });
        }
        titleRef = getImdbIdFromEntity(entity);
        if (!titleRef) {
          return NextResponse.json({ locations: 'location not found' });
        }
        wikidataMeta = buildWikidataMeta(entity);
      } catch (err) {
        console.error('Wikidata entity fetch error:', err.message);
        return NextResponse.json({
          locations: 'location not found',
        });
      }
    } else {
      const decoded = verifyImdbToken(rawId);
      titleRef = decoded?.imdbId || rawId;
    }

    const isTitleRef = typeof titleRef === 'string' && /^tt\d+$/.test(titleRef);
    if (!titleRef || !isTitleRef) {
      return NextResponse.json({
        locations: 'location not found',
      });
    }

    // Önce geocoded_locations tablosunda bu imdb_id var mı kontrol et (osm-geocoder çıktısı)
    const geocodedList = await getGeocodedLocations(titleRef);
    if (process.env.NODE_ENV === 'development') {
      console.log(`[locations] rawId=${rawId} titleRef=${titleRef} geocodedList=${geocodedList == null ? 'null' : geocodedList.length + ' rows'}`);
    }
    if (geocodedList && geocodedList.length > 0) {
      const end = performance.now();
      let resolvedTitle = getTitleFromEntity(entity) || null;
      if (!resolvedTitle) resolvedTitle = await fetchTitleByImdbId(titleRef);
      const body = {
        fromGeocodedDb: true,
        locations: geocodedList,
        runtime: end - start,
      };
      if (resolvedTitle) body.title = resolvedTitle;
      if (wikidataMeta) body.wikidataMeta = wikidataMeta;
      const res = NextResponse.json(body);
      res.headers.set('Cache-Control', 'no-store, max-age=0');
      return res;
    }
    if (!LOCATIONS_SERVICE_BASE_URL) {
      return NextResponse.json(
        { error: 'Locations service not configured' },
        { status: 503 }
      );
    }

    const serviceUrl = buildLocationsServiceUrl(titleRef);
    if (!serviceUrl) {
      return NextResponse.json(
        { error: 'Locations service not configured' },
        { status: 503 }
      );
    }

    const response = await axios.get(serviceUrl, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.data?.data?.title?.filmingLocations) {
      return NextResponse.json({
        locations: 'location not found',
      });
    }

    const titleObj = response.data.data.title;
    const locs = titleObj.filmingLocations.edges;
    const end = performance.now();
    const runtime = end - start;
    let resolvedTitle =
      titleObj.titleText?.text ||
      titleObj.originalTitleText?.text ||
      (typeof titleObj.title === 'string' ? titleObj.title : null) ||
      (typeof titleObj.name === 'string' ? titleObj.name : null) ||
      getTitleFromEntity(entity) ||
      null;
    if (!resolvedTitle && titleRef) {
      resolvedTitle = await fetchTitleByImdbId(titleRef);
    }

    const body = { locations: locs, runtime };
    if (resolvedTitle) body.title = resolvedTitle;
    if (wikidataMeta) body.wikidataMeta = wikidataMeta;

    const res = NextResponse.json(body);
    res.headers.set('Cache-Control', 'no-store, max-age=0');
    return res;
  } catch (error) {
    if (error.response?.status === 404) {
      return NextResponse.json({ locations: 'location not found' });
    }
    if (error.response?.status === 429) {
      return NextResponse.json(
        { error: 'Too many requests', message: 'Please try again in a few moments.' },
        { status: 429 }
      );
    }
    console.error('Error fetching locations:', error.message);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
