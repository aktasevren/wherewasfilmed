import { NextResponse } from 'next/server';
import axios from 'axios';

const TMDB_API_KEY = process.env.TMDB_API_KEY;

export async function GET(request, { params }) {
  try {
    if (!TMDB_API_KEY) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ TMDB_API_KEY environment variable is not set!');
      }
      return NextResponse.json(
        { 
          error: 'Movie service unavailable',
          message: 'TMDB_API_KEY environment variable is not configured'
        },
        { status: 503 }
      );
    }

    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Movie ID is required' },
        { status: 400 }
      );
    }

    const response = await axios.get(
      `https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_API_KEY}&language=en-US`,
      {
        timeout: 10000,
      }
    );

    return NextResponse.json({
      imdb_id: response.data?.imdb_id || null,
      title: response.data?.title || null,
      overview: response.data?.overview || null,
    });
  } catch (error) {
    console.error('Error fetching movie details:', error.message || error);
    
    if (error.response) {
      return NextResponse.json(
        { error: 'Failed to fetch movie details', details: error.response.data },
        { status: error.response.status || 500 }
      );
    } else if (error.request) {
      return NextResponse.json(
        { error: 'No response from movie service' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch movie details', details: error.message },
      { status: 500 }
    );
  }
}

