/**
 * Aranan filmleri kaydetme ve listeleme (son arananlar / popüler).
 * GET ?type=recent&limit=10  → son arananlar
 * GET ?type=popular&limit=10 → en çok aranan filmler
 * POST body: { movieId, title? } → yeni kayıt
 * Başlık yoksa veya Q/tt ID ise Wikidata'dan çözülür.
 */
import { NextResponse } from 'next/server';
import { connect } from '@/lib/db/mongo';
import SearchRecord from '@/lib/db/SearchRecord';
import { WIKIMEDIA_HEADERS } from '@/lib/wikidata';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

function parseLimit(limitRaw) {
  const n = limitRaw ? Number.parseInt(String(limitRaw), 10) : DEFAULT_LIMIT;
  return Math.max(1, Math.min(MAX_LIMIT, Number.isFinite(n) ? n : DEFAULT_LIMIT));
}

function needsTitleResolve(title, movieId) {
  if (!title || typeof title !== 'string') return true;
  const t = title.trim();
  if (t === '' || t === 'Unknown title') return true;
  if (/^Q\d+$/i.test(t) || /^tt\d+$/i.test(t)) return true;
  if (movieId && (String(movieId) === t)) return true; // title is same as id
  return false;
}

/** Wikidata Q ID ile İngilizce başlık (label) al. */
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
  } catch (err) {
    return null;
  }
}

/** IMDb tt ID ile Wikidata SPARQL'den İngilizce başlık al. */
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
  } catch (err) {
    return null;
  }
}

async function resolveTitle(movieId, currentTitle) {
  if (!movieId || !needsTitleResolve(currentTitle, movieId)) return currentTitle || '';
  const id = String(movieId).trim();
  if (/^Q\d+$/i.test(id)) return (await fetchTitleByWikidataId(id)) || currentTitle || id;
  if (/^tt\d+$/i.test(id)) return (await fetchTitleByImdbId(id)) || currentTitle || id;
  return currentTitle || id;
}

export async function GET(request) {
  try {
    const conn = await connect();
    if (!conn) {
      return NextResponse.json({ recent: [], popular: [], error: 'MongoDB not configured' });
    }

    const { searchParams } = new URL(request.url);
    const type = (searchParams.get('type') || 'recent').toLowerCase();
    const limit = parseLimit(searchParams.get('limit'));

    if (type === 'popular') {
      const popularRaw = await SearchRecord.aggregate([
        { $group: { _id: '$m', count: { $sum: 1 }, title: { $last: '$t' } } },
        { $sort: { count: -1 } },
        { $limit: limit },
        { $project: { movieId: '$_id', count: 1, title: 1, _id: 0 } },
      ]);
      const popular = await Promise.all(
        popularRaw.map(async (item) => ({
          ...item,
          title: await resolveTitle(item.movieId, item.title),
        }))
      );
      return NextResponse.json({ popular });
    }

    // recent (varsayılan): son eklenen kayıtlar, film bazında tekilleştirilmiş (son görüntülenen)
    const recentRaw = await SearchRecord.find()
      .sort({ at: -1 })
      .limit(limit * 3)
      .lean();

    const seen = new Set();
    const uniqueRaw = [];
    for (const r of recentRaw) {
      if (seen.has(r.m)) continue;
      seen.add(r.m);
      uniqueRaw.push({
        movieId: r.m,
        title: r.t || undefined,
        at: r.at,
      });
      if (uniqueRaw.length >= limit) break;
    }

    const recent = await Promise.all(
      uniqueRaw.map(async (item) => ({
        ...item,
        title: await resolveTitle(item.movieId, item.title),
      }))
    );

    return NextResponse.json({ recent });
  } catch (err) {
    console.error('Searches GET error:', err.message);
    return NextResponse.json(
      { error: 'Internal Server Error', recent: [], popular: [] },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const conn = await connect();
    if (!conn) {
      return NextResponse.json({ ok: false, error: 'MongoDB not configured' }, { status: 503 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
    }

    const raw = typeof body.movieId === 'string' ? body.movieId.trim() : '';
    const movieId = raw.length >= 2 && raw.length <= 120 ? raw : null;
    if (!movieId) {
      return NextResponse.json(
        { ok: false, error: 'movieId required (2-120 chars)' },
        { status: 400 }
      );
    }

    const title = typeof body.title === 'string' ? body.title.slice(0, 80) : '';

    await SearchRecord.create({
      m: movieId,
      t: title,
      at: new Date(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Searches POST error:', err.message);
    return NextResponse.json(
      { ok: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
