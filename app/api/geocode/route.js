import { NextResponse } from 'next/server';
import axios from 'axios';

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
          message: 'GEOAPIFY_API_KEY environment variable is not configured'
        },
        { status: 503 }
      );
    }

    const encodedPlace = encodeURIComponent(place);
    const geoResponse = await axios.get(
      `https://api.geoapify.com/v1/geocode/search?text=${encodedPlace}&apiKey=${GEOAPIFY_API_KEY}`,
      { timeout: 8000 }
    );

    const feature = geoResponse?.data?.features?.[0];
    const coordinates = feature?.geometry?.coordinates;
    const bbox = feature?.bbox || null;
    const placeType = feature?.properties?.result_type || feature?.properties?.type || null;
    const formatted = feature?.properties?.formatted || feature?.properties?.name || place;
    
    if (!coordinates || coordinates.length < 2) {
      return NextResponse.json(
        { error: 'Coordinates not found for this place' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      Xcoor: coordinates[0],
      Ycoor: coordinates[1],
      bbox,
      placeType,
      formatted,
    });
  } catch (error) {
    const status = error.response?.status;
    const message = error.response?.data?.message ?? error.message;
    if (status === 401 || status === 403) {
      return NextResponse.json(
        { error: 'Geocoding service authentication failed' },
        { status: 503 }
      );
    }
    if (status === 429) {
      return NextResponse.json(
        { error: 'Too many geocode requests' },
        { status: 429 }
      );
    }
    console.error('Geocode error:', message);
    return NextResponse.json(
      { error: 'Failed to fetch geocode' },
      { status: status && status >= 400 && status < 500 ? status : 500 }
    );
  }
}
