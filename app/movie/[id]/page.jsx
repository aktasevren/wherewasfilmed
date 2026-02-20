'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import dynamic from 'next/dynamic';
import AppHeader from '@/app/components/AppHeader';
import Footer from '@/app/components/Footer';
import { getLocations } from '@/lib/redux/actions/MovieActions';

const SelectedMovie = dynamic(() => import('@/app/components/SelectedMovie'), { ssr: false });

export default function MoviePage() {
  const params = useParams();
  const dispatch = useDispatch();
  const movieId = params.id;
  const [isLoading, setIsLoading] = useState(true);
  const movieDetails = useSelector((state) => state.MovieReducer.movieDetails);
  const movieInfos = useSelector((state) => state.MovieReducer.movieInfos);
  const geocodeProgress = useSelector((state) => state.MovieReducer.geocodeProgress);

  useEffect(() => {
    if (movieId) {
      dispatch(getLocations(movieId));
    }
  }, [movieId, dispatch]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://wherewasfilmed.com';
  const movieTitle = movieDetails?.title || movieDetails?.original_title;
  const sanitizeJsonLd = (obj) => JSON.stringify(obj).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');

  const movieLd = movieDetails
    ? {
        '@context': 'https://schema.org',
        '@type': 'Movie',
        name: movieTitle,
        description: movieDetails.overview || undefined,
        image: movieDetails.poster_url || `${siteUrl}/assets/film.png`,
        ...(movieDetails.wikidataMeta?.year && { datePublished: String(movieDetails.wikidataMeta.year) }),
        ...(movieInfos &&
          movieInfos.length > 0 && {
            contentLocation: movieInfos
              .map((loc) => ({
                '@type': 'Place',
                name: loc.place,
                ...(loc.Ycoor != null &&
                  loc.Xcoor != null && {
                    geo: { '@type': 'GeoCoordinates', latitude: loc.Ycoor, longitude: loc.Xcoor },
                  }),
                ...(loc.desc &&
                  loc.desc !== 'No description available' && { description: loc.desc }),
              }))
              .filter((l) => l.geo),
          }),
      }
    : null;

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      {
        '@type': 'ListItem',
        position: 2,
        name: movieTitle ? `${movieTitle} Filming Locations` : 'Filming Locations',
        item: `${siteUrl}/movie/${movieId}`,
      },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080810] text-white">
      {movieLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: sanitizeJsonLd(movieLd) }} />
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: sanitizeJsonLd(breadcrumbLd) }} />
      <AppHeader />
      {/* pt-24 (6rem) header için; main yüksekliği içeriğe göre (harita ~380vh) — flex:1 yok ki büyüsün */}
      <main className="pt-24 flex flex-col min-h-0 flex-shrink-0">
        <SelectedMovie onLoadingChange={setIsLoading} />
      </main>
      <Footer />
    </div>
  );
}

