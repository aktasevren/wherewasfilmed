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

export default function SearchedMovies() {
  const dispatch = useDispatch();
  const fMovies = useSelector((state) => state.MovieReducer.fMovies);
  const fMoviesLoading = useSelector((state) => state.MovieReducer.fMoviesLoading);

  useEffect(() => {}, [fMovies]);

  // Show skeleton (when loading or no data)
  if (fMoviesLoading || fMovies.length === 0) {
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

  return (
    <Container className="movies-container">
      <Row className="movies-row">
        {fMovies.map((movie, index) => (
          <Col key={index} xl={3} lg={6} sm={12} className="movie-col">
            <Link
              href={`/movie/${movie.id}`}
              style={{ textDecoration: 'none' }}
              onClick={() => {
                dispatch(getLocations(movie.id));
                dispatch(getPoster(movie.poster_path));
              }}
            >
              <article className="card movie-card">
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

