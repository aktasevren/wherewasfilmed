import { NextResponse } from 'next/server';
import axios from 'axios';
import connectDB from '@/lib/mongodb';
import Movie from '@/models/Movie';

const version = '24.2';

// External service endpoint (maskelenmiş)
const getExternalServiceUrl = (identifier) => {
  const baseUrl = 'https://caching.graphql.imdb.com';
  const operation = 'TitleFilmingLocationsPaginated';
  const afterToken = 'bGMwMjkwODcz';
  const hash = '9f2ac963d99baf72b7a108de141901f4caa8c03af2e1a08dfade64db843eff7b';
  
  const variables = {
    after: afterToken,
    const: identifier,
    first: 50,
    isAutoTranslationEnabled: false,
    locale: 'en-US',
    originalTitleText: false,
  };
  
  const extensions = {
    persistedQuery: {
      sha256Hash: hash,
      version: 1,
    },
  };
  
  const params = new URLSearchParams({
    operationName: operation,
    variables: JSON.stringify(variables),
    extensions: JSON.stringify(extensions),
  });
  
  return `${baseUrl}/?${params.toString()}`;
};

export async function GET(request, { params }) {
  const start = performance.now();
  const { id: imdbid } = await params;

  try {
    await connectDB();

    let existingMovie = await Movie.findOne({ imdbid });
    if (existingMovie) {
      return NextResponse.json({
        imdbid: existingMovie.imdbid,
        locations: existingMovie.locations,
        runtime: existingMovie.runtime,
        source: 'mongodb',
      });
    }

    const serviceUrl = getExternalServiceUrl(imdbid);
    const response = await axios.get(serviceUrl, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.data.data || !response.data.data.title.filmingLocations) {
      return NextResponse.json({
        version,
        imdbid,
        locations: 'location not found',
        source: 'api',
      });
    }

    const locs = response.data.data.title.filmingLocations.edges;
    const end = performance.now();
    const runtime = end - start;

    existingMovie = new Movie({ imdbid, locations: locs, runtime });
    await existingMovie.save();

    return NextResponse.json({
      imdbid,
      locations: locs,
      runtime,
      source: 'api',
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

