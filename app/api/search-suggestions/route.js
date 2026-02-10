import { NextResponse } from 'next/server';
import axios from 'axios';
import { createImdbToken } from '@/lib/imdbToken';
import { getMovieTitlesByQuery } from '@/lib/db/pg';
import {
  WIKIMEDIA_HEADERS,
  pickFirstClaimValue,
  hasInstanceOf,
  parseWikidataYear,
  commonsImageUrl,
} from '@/lib/wikidata';

const WIKIDATA_API_BASE_URL = 'https://www.wikidata.org/w/api.php';
const IMDB_ID = 'P345';
const PUBLICATION_DATE = 'P577';
const IMAGE = 'P18';
const WD_FILM = 'Q11424';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();
  const continueRaw = searchParams.get('continue') ?? searchParams.get('c');
  const continueOffset = continueRaw ? Number.parseInt(String(continueRaw), 10) : 0;
  const limitRaw = searchParams.get('limit');
  const searchPageSize = Math.max(5, Math.min(20, limitRaw ? Number.parseInt(String(limitRaw), 10) : 10));

  if (!q) {
    return NextResponse.json(
      { error: 'Query is required', movies: [], series: [], source: null },
      { status: 400 }
    );
  }

  try {
    // Diyagram: önce DB (imdb_dataset title / movie_titles)
    const dbRows = await getMovieTitlesByQuery(q, searchPageSize);
    if (process.env.NODE_ENV === 'development') {
      console.log('[search-suggestions] q=%s dbRows=%s', q, dbRows?.length ?? 'null');
    }
    if (dbRows && dbRows.length > 0) {
      const movies = dbRows.map((r) => {
        const token = createImdbToken(r.tconst) || r.tconst;
        return {
          id: token,
          wikidata_id: null,
          title: r.primary_title ?? '',
          original_title: r.original_title ?? r.primary_title ?? '',
          overview: '',
          subtitle: '',
          poster_url: null,
          poster_path: null,
          year: r.start_year ?? null,
          yr: null,
          type: 'movie',
        };
      });
      return NextResponse.json({
        movies,
        series: [],
        continue: null,
        source: 'db',
      });
    }

    // YOK: Wikidata searchbar servisi
    const movies = [];
    const series = [];
    const nextContinue =
      Number.isFinite(continueOffset) && continueOffset > 0 ? continueOffset : null;

    const searchRes = await axios.get(WIKIDATA_API_BASE_URL, {
      params: {
        action: 'wbsearchentities',
        format: 'json',
        limit: searchPageSize,
        language: 'en',
        uselang: 'en',
        type: 'item',
        search: q,
        origin: '*',
        ...(nextContinue != null ? { continue: nextContinue } : {}),
      },
      headers: WIKIMEDIA_HEADERS,
      timeout: 10000,
    });

    const searchList = searchRes.data?.search ?? [];
    const ids = searchList.map((x) => x?.id).filter(Boolean);
    const searchContinue = searchRes.data?.['search-continue'] ?? null;
    const returnedContinue = Number.isFinite(searchContinue) ? searchContinue : null;

    if (ids.length > 0) {
      const entitiesRes = await axios.get(WIKIDATA_API_BASE_URL, {
        params: {
          action: 'wbgetentities',
          format: 'json',
          ids: ids.join('|'),
          props: 'claims|labels',
          languages: 'en',
          origin: '*',
        },
        headers: WIKIMEDIA_HEADERS,
        timeout: 10000,
      });

      const entities = entitiesRes.data?.entities ?? {};
      const byId = new Map(searchList.map((x) => [x.id, x]));

      for (const id of ids) {
        const entity = entities[id];
        const s = byId.get(id);
        if (!entity || !s) continue;

        if (!hasInstanceOf(entity, WD_FILM)) continue;

        const imdb = pickFirstClaimValue(entity, IMDB_ID);
        if (typeof imdb !== 'string' || !/^tt\d+$/.test(imdb)) continue;

        const token = createImdbToken(imdb) || imdb;

        const year = parseWikidataYear(pickFirstClaimValue(entity, PUBLICATION_DATE));
        const img = pickFirstClaimValue(entity, IMAGE);
        const poster_url = commonsImageUrl(img, 220);

        movies.push({
          id: token,
          wikidata_id: id,
          title: s.label ?? '',
          original_title: s.label ?? '',
          overview: s.description ?? '',
          subtitle: s.description ?? '',
          poster_url: poster_url,
          poster_path: null,
          year: year,
          yr: null,
          type: 'movie',
        });
      }
    }

    return NextResponse.json({
      movies,
      series,
      continue: returnedContinue,
      source: 'web',
    });
  } catch (error) {
    console.error('Suggestion search error:', error.message);
    return NextResponse.json(
      { error: 'Search failed', movies: [], series: [], source: null },
      { status: 500 }
    );
  }
}
