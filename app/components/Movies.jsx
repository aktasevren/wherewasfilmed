'use client';

import React, { useEffect } from 'react';
import { Container, Col, Row } from 'react-bootstrap';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { getLocations, getPoster } from '@/lib/redux/actions/MovieActions';
import { getImageUrl } from '@/lib/utils/imageUrl';

// Skeleton Card Component
const MovieCardSkeleton = () => {
  return (
    <Col xl={3} lg={6} sm={12}>
      <article className="card skeleton-card">
        <div className="skeleton-image"></div>
        <div className="card__content | flow">
          <div className="card__content--container | flow">
            <div className="skeleton-title"></div>
            <div className="skeleton-description">
              <div className="skeleton-line"></div>
              <div className="skeleton-line"></div>
              <div className="skeleton-line skeleton-line-short"></div>
            </div>
          </div>
        </div>
      </article>
    </Col>
  );
};

export default function Movies() {
  const dispatch = useDispatch();
  const popularMovies = useSelector((state) => state.MovieReducer.popularMovies);
  const popularMoviesLoading = useSelector((state) => state.MovieReducer.popularMoviesLoading);

  useEffect(() => {
  }, [popularMovies]);

  // Skeleton göster (sadece loading durumunda)
  if (popularMoviesLoading) {
    return (
      <Container className="movies-container">
        <Row className="movies-row">
          {[...Array(8)].map((_, index) => (
            <MovieCardSkeleton key={index} />
          ))}
        </Row>
      </Container>
    );
  }

  // Eğer loading tamamlandı ama veri yoksa, hata mesajı göster
  if (!popularMoviesLoading && popularMovies.length === 0) {
    return (
      <Container className="movies-container">
        <Row className="movies-row">
          <Col xs={12}>
            <div className="error-message-container">
              <div className="error-icon" style={{ fontSize: '64px', marginBottom: '24px' }}>
                ⚠️
              </div>
              <h3 className="error-title">
                Filmler Yüklenemedi
              </h3>
              <p className="error-description">
                API yapılandırması eksik. Lütfen <code>TMDB_API_KEY</code> environment variable'ını ekleyin.
              </p>
              <div className="error-steps">
                <h4 style={{ marginBottom: '16px', fontSize: '18px', color: '#9fd3c7' }}>
                  Kurulum Adımları:
                </h4>
                <ol style={{ textAlign: 'left', maxWidth: '600px', margin: '0 auto', color: '#9fd3c7', lineHeight: '2' }}>
                  <li style={{ marginBottom: '12px' }}>
                    Proje root dizininde <code style={{ background: 'rgba(159, 211, 199, 0.2)', padding: '2px 8px', borderRadius: '4px' }}>.env.local</code> dosyası oluşturun
                  </li>
                  <li style={{ marginBottom: '12px' }}>
                    Dosyaya şu satırı ekleyin: <br />
                    <code style={{ background: 'rgba(159, 211, 199, 0.2)', padding: '4px 8px', borderRadius: '4px', display: 'inline-block', marginTop: '4px' }}>
                      TMDB_API_KEY=your_api_key_here
                    </code>
                  </li>
                  <li style={{ marginBottom: '12px' }}>
                    API key almak için: <br />
                    <a 
                      href="https://www.themoviedb.org/settings/api" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ color: '#9fd3c7', textDecoration: 'underline' }}
                    >
                      https://www.themoviedb.org/settings/api
                    </a>
                  </li>
                  <li>
                    Development server'ı <strong>yeniden başlatın</strong> (environment variable değişiklikleri için gerekli)
                  </li>
                </ol>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container className="movies-container">
      <Row className="movies-row">
        {popularMovies.map((movie, index) => (
          <Col key={index} xl={3} lg={6} sm={12} className="movie-col">
            <Link key={index} href={`/movie/${movie.id}`} style={{ textDecoration: 'none' }}>
              <article
                className="card"
                onClick={() => {
                  dispatch(getLocations(movie.id));
                  dispatch(getPoster(movie.poster_path));
                }}
              >
                <img
                  className="card__background"
                  src={getImageUrl(movie.poster_path, 'original')}
                  alt={movie.overview?.slice(0, 144) + '...' || 'Movie poster'}
                  loading="lazy"
                />
                <div className="card__content | flow">
                  <div className="card__content--container | flow">
                    <h2 className="card__title">{movie.original_title}</h2>
                    <p className="card__description">
                      {movie.overview.slice(0, 144) + '...'}
                    </p>
                  </div>
                </div>
              </article>
            </Link>
          </Col>
        ))}
      </Row>
    </Container>
  );
}

