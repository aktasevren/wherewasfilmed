import { NextResponse } from 'next/server';
import axios from 'axios';

const TMDB_API_KEY = process.env.TMDB_API_KEY;

export async function GET(request) {
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

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    const response = await axios.get(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&language=en-US&query=${encodeURIComponent(query)}&page=1&include_adult=false`,
      {
        timeout: 10000,
      }
    );

    if (!response.data || !response.data.results) {
      return NextResponse.json([]);
    }

    const filteredMovies = response.data.results.filter(
      (movie) => movie.genre_ids && !movie.genre_ids.includes(16) // Animasyon filmleri filtrelendi
    );

    return NextResponse.json(filteredMovies);
  } catch (error) {
    console.error('Error fetching movie search results:', error.message || error);
    
    if (error.response) {
      return NextResponse.json(
        { error: 'Failed to fetch movie search results', details: error.response.data },
        { status: error.response.status || 500 }
      );
    } else if (error.request) {
      return NextResponse.json(
        { error: 'No response from movie service' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch movie search results', details: error.message },
      { status: 500 }
    );
  }
}

