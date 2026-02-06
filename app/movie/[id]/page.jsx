'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import NavbarComponent from '@/app/components/NavbarComponent';
import SelectedMovie from '@/app/components/SelectedMovie';
import Footer from '@/app/components/Footer';
import { getLocations } from '@/lib/redux/actions/MovieActions';

export default function MoviePage() {
  const params = useParams();
  const dispatch = useDispatch();
  const movieId = params.id;
  const movieDetails = useSelector((state) => state.MovieReducer.movieDetails);
  const movieInfos = useSelector((state) => state.MovieReducer.movieInfos);

  useEffect(() => {
    if (movieId) {
      dispatch(getLocations(movieId));
    }
  }, [movieId, dispatch]);

  // Generate JSON-LD structured data for movie
  const jsonLd = movieDetails ? {
    "@context": "https://schema.org",
    "@type": "Movie",
    "name": movieDetails.title || movieDetails.original_title,
    "description": movieDetails.overview,
    "image": movieDetails.poster_url || "/assets/film.png",
    "datePublished": "",
    ...(movieInfos && movieInfos.length > 0 && {
      "contentLocation": movieInfos.map((location) => ({
        "@type": "Place",
        "name": location.place,
        "geo": location.Ycoor && location.Xcoor ? {
          "@type": "GeoCoordinates",
          "latitude": location.Ycoor,
          "longitude": location.Xcoor
        } : undefined,
        "description": location.desc
      })).filter(loc => loc.geo)
    })
  } : null;

  return (
    <div className="App">
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <NavbarComponent />
      <main>
        <SelectedMovie />
      </main>
      <Footer />
    </div>
  );
}

