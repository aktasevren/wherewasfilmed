import { NextResponse } from 'next/server';
import axios from 'axios';

const TMDB_API_KEY = process.env.TMDB_API_KEY;

export async function GET(request, { params }) {
  try {
    if (!TMDB_API_KEY) {
      return NextResponse.json(
        { error: 'Movie service unavailable' },
        { status: 503 }
      );
    }

    const { id } = await params;
    const response = await axios.get(
      `https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_API_KEY}&language=en-US`
    );

    return NextResponse.json({
      imdb_id: response.data.imdb_id,
      title: response.data.title,
      overview: response.data.overview,
    });
  } catch (error) {
    console.error('Error fetching movie details:', error);
    return NextResponse.json({ error: 'Failed to fetch movie details' }, { status: 500 });
  }
}

