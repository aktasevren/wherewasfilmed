'use client';

import React, { useEffect } from 'react';
import { Container, Col, Row } from 'react-bootstrap';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { getLocations } from '@/lib/redux/actions/MovieActions';
import { encodeMovieId } from '@/lib/movieId';

const MovieCardSkeleton = () => (
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

function ResultCard({ item, dispatch }) {
  const movieId = item.wikidata_id || item.id;
  const encodedId = encodeMovieId(movieId);
  return (
    <Col key={item.id} xl={3} lg={6} sm={12} className="movie-col">
      <Link
        href={`/movie/${encodedId}`}
        style={{ textDecoration: 'none' }}
        onClick={() => {
          dispatch(getLocations(encodedId, item));
        }}
      >
        <article className="card movie-card">
          <img
            className="card__background"
            src={item.poster_url || '/assets/film.png'}
            alt={`${item.original_title || item.title} poster`}
            loading="lazy"
            decoding="async"
            width={500}
            height={750}
            sizes="(max-width: 576px) 100vw, (max-width: 992px) 50vw, 25vw"
          />
          <div className="card__content | flow">
            <div className="card__content--container | flow">
              <h2 className="card__title">{item.original_title || item.title}</h2>
              <p className="card__description">
                {(item.overview || item.subtitle || '').slice(0, 144)}
                {((item.overview || item.subtitle || '').length > 144) ? '...' : ''}
              </p>
              <span className={`searched-badge searched-badge--${item.type}`}>
                {item.type === 'movie' ? 'Movie' : 'Series'}
              </span>
            </div>
          </div>
        </article>
      </Link>
    </Col>
  );
}

export default function SearchedMovies() {
  const dispatch = useDispatch();
  const fMovies = useSelector((state) => state.MovieReducer.fMovies);
  const fMoviesLoading = useSelector((state) => state.MovieReducer.fMoviesLoading);

  const movies = fMovies?.movies ?? [];
  const series = fMovies?.series ?? [];
  const hasResults = movies.length > 0 || series.length > 0;

  useEffect(() => {}, [fMovies]);

  if (fMoviesLoading) {
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

  if (!hasResults) {
    return (
      <Container className="movies-container">
        <div className="searched-empty">
          <p>No movies or series found. Try another search.</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="movies-container">
      {movies.length > 0 && (
        <div className="searched-section">
          <h2 className="searched-section-title searched-section-title--movie">Movies</h2>
          <Row className="movies-row">
            {movies.map((item) => (
              <ResultCard key={item.id} item={item} dispatch={dispatch} />
            ))}
          </Row>
        </div>
      )}
      {series.length > 0 && (
        <div className="searched-section">
          <h2 className="searched-section-title searched-section-title--series">Series</h2>
          <Row className="movies-row">
            {series.map((item) => (
              <ResultCard key={item.id} item={item} dispatch={dispatch} />
            ))}
          </Row>
        </div>
      )}
    </Container>
  );
}
