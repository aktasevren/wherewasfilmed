'use client';

import {
  GET_LOCATIONS,
  GET_MOVIE_DETAILS,
  FETCH_MOVIES,
  FETCH_MOVIES_LOADING,
  GEOCODE_PROGRESS_RESET,
  GEOCODE_PROGRESS_UPDATE,
} from './ActionTypes';
import axios from 'axios';
import { getAlertify } from '@/lib/alertify';

export const getLocations = (id, meta = {}) => async (dispatch, getState) => {
  const movieInfo = [];
  let noMovie = false;

  try {
    const existing = getState?.().MovieReducer?.movieDetails;
    const idIsImdb = typeof id === 'string' && /^tt\d+$/.test(id);
    const title =
      meta.title ||
      meta.original_title ||
      existing?.title ||
      existing?.original_title ||
      (idIsImdb ? id : null) ||
      'Unknown title';
    const overview = meta.overview || meta.subtitle || existing?.overview || '';
    const poster_url =
      meta.poster_url ||
      meta.posterUrl ||
      meta.poster ||
      existing?.poster_url ||
      existing?.posterUrl ||
      null;

    dispatch({
      type: GET_MOVIE_DETAILS,
      payload: {
        title,
        overview,
        id: id,
        poster_url,
      },
    });

    const locationsResponse = await axios.get(`/api/locations/${id}`);
    const apiTitle = locationsResponse.data?.title;

    if (
      !locationsResponse.data.locations ||
      locationsResponse.data.locations.length === 0 ||
      locationsResponse.data.locations === 'location not found'
    ) {
      const alertify = await getAlertify();
      if (alertify) {
        alertify.set('notifier', 'position', 'top-right');
        alertify.error('No location found for this movie.');
      }
      noMovie = true;

      dispatch({
        type: GEOCODE_PROGRESS_RESET,
        payload: { total: 0 },
      });
      dispatch({
        type: GEOCODE_PROGRESS_UPDATE,
        payload: { total: 0, processed: 0, found: 0, status: 'done' },
      });
    } else {
      const wikidataMeta = locationsResponse.data?.wikidataMeta;
      const current = getState?.().MovieReducer?.movieDetails ?? {};
      if (apiTitle || wikidataMeta) {
        dispatch({
          type: GET_MOVIE_DETAILS,
          payload: {
            ...current,
            ...(apiTitle && { title: apiTitle }),
            ...(wikidataMeta && { wikidataMeta }),
          },
        });
      }

      locationsResponse.data.locations.map((res) => {
        movieInfo.push({
          place: res.node.location,
          desc:
            res.node?.displayableProperty?.qualifiersInMarkdownList?.[0]
              ?.markdown || 'No description available',
        });
      });

      dispatch({
        type: GEOCODE_PROGRESS_RESET,
        payload: { total: movieInfo.length },
      });

      const GEOCODE_CONCURRENCY = 8;
      const PROGRESS_THROTTLE_MS = 150;
      let lastProgressAt = 0;

      const fetchOne = async (movie, index) => {
        try {
          const geoResponse = await axios.get(
            `/api/geocode?place=${encodeURIComponent(movie.place)}`
          );
          movie.Xcoor = geoResponse.data.Xcoor;
          movie.Ycoor = geoResponse.data.Ycoor;
          movie.bbox = geoResponse.data.bbox || null;
          movie.placeType = geoResponse.data.placeType || null;
          movie.formatted = geoResponse.data.formatted || movie.place;
          movie.index = index;
        } catch (err) {
          console.warn('Geocode failed for:', movie.place, err.message);
        }
      };

      for (let i = 0; i < movieInfo.length; i += GEOCODE_CONCURRENCY) {
        const chunk = movieInfo.slice(i, i + GEOCODE_CONCURRENCY);
        await Promise.all(chunk.map((movie, j) => fetchOne(movie, i + j)));
        const processed = Math.min(i + chunk.length, movieInfo.length);
        const now = Date.now();
        if (now - lastProgressAt >= PROGRESS_THROTTLE_MS || processed === movieInfo.length) {
          lastProgressAt = now;
          const found = movieInfo.filter(
            (m) => m.Ycoor !== undefined && m.Xcoor !== undefined
          ).length;
          dispatch({
            type: GEOCODE_PROGRESS_UPDATE,
            payload: {
              total: movieInfo.length,
              processed,
              found,
              status: 'running',
            },
          });
        }
      }
    }

      dispatch({
        type: GET_LOCATIONS,
        payload: {
          movieInfo,
          noMovie,
        },
      });

    // Aranan filmi kaydet (son / popüler listeler için; fire-and-forget)
    const movieIdToRecord = meta.wikidata_id || id;
    const stateAfter = getState?.().MovieReducer?.movieDetails;
    const titleToRecord =
      apiTitle ||
      meta.title ||
      meta.original_title ||
      stateAfter?.title ||
      stateAfter?.original_title ||
      title;
    const finalTitle =
      titleToRecord && titleToRecord !== 'Unknown title'
        ? titleToRecord
        : (apiTitle || stateAfter?.title || '');
    if (movieIdToRecord) {
      fetch('/api/searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movieId: movieIdToRecord,
          title: (finalTitle && finalTitle !== 'Unknown title' ? finalTitle : '') || stateAfter?.title || '',
        }),
      }).catch(() => {});
    }
  } catch (error) {
    console.error('Error fetching locations:', error);
  }
};

export const fetchMovies = (movieValue) => async (dispatch) => {
  dispatch({
    type: FETCH_MOVIES_LOADING,
    payload: true,
  });

  try {
    const response = await axios.get(`/api/search-suggestions?q=${encodeURIComponent(movieValue)}`);

    if (response.status === 503 || response.status === 400) {
      const alertify = await getAlertify();
      if (alertify) {
        alertify.set('notifier', 'position', 'top-right');
        alertify.warning('Search service is currently unavailable.');
      }
      dispatch({
        type: FETCH_MOVIES,
        payload: { movies: [], series: [] },
      });
    } else {
      const movies = response.data?.movies ?? [];
      const series = response.data?.series ?? [];
      dispatch({
        type: FETCH_MOVIES,
        payload: { movies, series },
      });
    }
    dispatch({
      type: FETCH_MOVIES_LOADING,
      payload: false,
    });
  } catch (error) {
    console.error('Error fetching movies:', error.response?.data || error.message || error);
    const alertify = await getAlertify();
    if (alertify) {
      alertify.set('notifier', 'position', 'top-right');
      alertify.error('Failed to search movies. Please try again later.');
    }
    dispatch({
      type: FETCH_MOVIES,
      payload: { movies: [], series: [] },
    });
    dispatch({
      type: FETCH_MOVIES_LOADING,
      payload: false,
    });
  }
};

