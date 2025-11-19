import { NextResponse } from 'next/server';
import axios from 'axios';

const TMDB_API_KEY = process.env.TMDB_API_KEY;

export async function GET() {
  try {
    if (!TMDB_API_KEY) {
      return NextResponse.json(
        { error: 'Movie service unavailable' },
        { status: 503 }
      );
    }

    const response = await axios.get(
      `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`
    );

    if (!response.data.results) {
      return NextResponse.json({ message: 'No movies found' }, { status: 404 });
    }

    // Animasyon (genre_id: 16) olmayan filmleri filtrele
    const filteredMovies = response.data.results.filter(movie => !movie.genre_ids.includes(16));

    return NextResponse.json(filteredMovies);
  } catch (error) {
    console.error('Error fetching popular movies:', error);
    return NextResponse.json({ error: 'Failed to fetch movies' }, { status: 500 });
  }
}

