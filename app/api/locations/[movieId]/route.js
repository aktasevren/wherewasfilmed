/**
 * Filming locations API. IMDb is used ONLY here: we need an IMDb title ID (tt...)
 * to call LOCATIONS_SERVICE_BASE_URL (GraphQL). When the client sends a Wikidata ID (Q...),
 * we resolve it to IMDb via Wikidata entity; when they send a token, we verify and use the IMDb ID.
 */
import { NextResponse } from 'next/server';
import axios from 'axios';
import { verifyImdbToken } from '@/lib/imdbToken';
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
    if (!LOCATIONS_SERVICE_BASE_URL) {
      return NextResponse.json(
        { error: 'Locations service not configured' },
        { status: 503 }
      );
    }

    if (typeof movieId !== 'string' || !movieId) {
      return NextResponse.json({
        locations: 'location not found',
      });
    }

    let titleRef;
    let wikidataMeta = null;
    if (isWikidataId(movieId)) {
      try {
        const entity = await fetchWikidataEntity(movieId);
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
      const decoded = verifyImdbToken(movieId);
      titleRef = decoded?.imdbId || movieId;
    }

    const isTitleRef = typeof titleRef === 'string' && /^tt\d+$/.test(titleRef);
    if (!titleRef || !isTitleRef) {
      return NextResponse.json({
        locations: 'location not found',
      });
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

    const locs = response.data.data.title.filmingLocations.edges;
    const end = performance.now();
    const runtime = end - start;

    const body = { locations: locs, runtime };
    if (wikidataMeta) body.wikidataMeta = wikidataMeta;

    return NextResponse.json(body);
  } catch (error) {
    if (error.response?.status === 404) {
      return NextResponse.json({ locations: 'location not found' });
    }
    console.error('Error fetching locations:', error.message);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
