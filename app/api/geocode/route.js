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
      `https://api.geoapify.com/v1/geocode/search?text=${encodedPlace}&apiKey=${GEOAPIFY_API_KEY}`
    );

    const coordinates = geoResponse?.data?.features?.[0]?.geometry?.coordinates;
    
    if (!coordinates || coordinates.length < 2) {
      return NextResponse.json(
        { error: 'Coordinates not found for this place' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      Xcoor: coordinates[0],
      Ycoor: coordinates[1],
    });
  } catch (error) {
    console.error('Error fetching geocode:', error);
    return NextResponse.json(
      { error: 'Failed to fetch geocode' },
      { status: 500 }
    );
  }
}
