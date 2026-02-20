import { NextResponse } from 'next/server';

const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const place = searchParams.get('place');

    if (!place) {
      return NextResponse.json(
        { error: 'Place parameter is required' },
        { status: 400 }
      );
    }

    if (!GEOAPIFY_API_KEY) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ GEOAPIFY_API_KEY environment variable is not set!');
        console.error('📝 Please add GEOAPIFY_API_KEY to your .env.local file');
      }
      return NextResponse.json(
        {
          error: 'Geocoding service unavailable',
          message: 'GEOAPIFY_API_KEY environment variable is not configured',
        },
        { status: 503 }
      );
    }

    const encodedPlace = encodeURIComponent(place);
    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodedPlace}&apiKey=${GEOAPIFY_API_KEY}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    let res;
    try {
      res = await fetch(url, { signal: controller.signal });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      const msg = fetchErr?.name === 'AbortError' ? 'Geocode request timeout' : fetchErr?.message || 'fetch failed';
      if (process.env.NODE_ENV === 'development') {
        console.warn('Geocode error:', msg);
      }
      return NextResponse.json({
        error: msg,
        Xcoor: null,
        Ycoor: null,
        bbox: null,
        placeType: null,
        formatted: place,
      });
    }
    clearTimeout(timeoutId);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.message || 'Geocoding request failed' },
        { status: res.status >= 400 ? res.status : 502 }
      );
    }

    const data = await res.json();
    const feature = data?.features?.[0];
    const coordinates = feature?.geometry?.coordinates;
    const bbox = feature?.bbox ?? null;
    const placeType =
      feature?.properties?.result_type ||
      feature?.properties?.type ||
      null;
    const formatted =
      feature?.properties?.formatted ||
      feature?.properties?.name ||
      place;

    if (!coordinates || coordinates.length < 2) {
      return NextResponse.json({
        error: 'Coordinates not found for this place',
        Xcoor: null,
        Ycoor: null,
        bbox: null,
        placeType: null,
        formatted: place,
      });
    }

    return NextResponse.json({
      Xcoor: coordinates[0],
      Ycoor: coordinates[1],
      bbox,
      placeType,
      formatted,
    });
  } catch (error) {
    const message = error?.message || 'Failed to fetch geocode';
    if (process.env.NODE_ENV === 'development') {
      console.warn('Geocode error:', message);
    }
    return NextResponse.json({
      error: message,
      Xcoor: null,
      Ycoor: null,
      bbox: null,
      placeType: null,
      formatted: place ?? null,
    });
  }
}
