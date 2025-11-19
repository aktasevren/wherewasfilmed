import { NextResponse } from 'next/server';
import axios from 'axios';

const TMDB_API_KEY = process.env.TMDB_API_KEY;

export async function GET() {
  try {
    if (!TMDB_API_KEY) {
      // Development ortamında daha detaylı hata mesajı
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ TMDB_API_KEY environment variable is not set!');
        console.error('📝 Please create a .env.local file in the project root with:');
        console.error('   TMDB_API_KEY=your_api_key_here');
        console.error('🔗 Get your API key from: https://www.themoviedb.org/settings/api');
      }
      return NextResponse.json(
        { 
          error: 'Movie service unavailable',
          message: 'TMDB_API_KEY environment variable is not configured. Please check your .env.local file.'
        },
        { status: 503 }
      );
    }

    const response = await axios.get(
      `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`,
      {
        timeout: 10000,
      }
    );

    if (!response.data || !response.data.results) {
      return NextResponse.json({ message: 'No movies found' }, { status: 404 });
    }

    // Animasyon (genre_id: 16) olmayan filmleri filtrele
    const filteredMovies = response.data.results.filter(
      (movie) => movie.genre_ids && !movie.genre_ids.includes(16)
    );

    return NextResponse.json(filteredMovies);
  } catch (error) {
    console.error('Error fetching popular movies:', error.message || error);
    
    if (error.response) {
      // TMDB API'den gelen hata
      return NextResponse.json(
        { error: 'Failed to fetch movies from external service', details: error.response.data },
        { status: error.response.status || 500 }
      );
    } else if (error.request) {
      // İstek gönderildi ama yanıt alınamadı
      return NextResponse.json(
        { error: 'No response from movie service' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch movies', details: error.message },
      { status: 500 }
    );
  }
}

