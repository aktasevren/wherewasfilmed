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
  let movieInfo = [];
  let noMovie = false;

  try {
    const existing = getState?.().MovieReducer?.movieDetails;
    const title =
      meta.title ||
      meta.original_title ||
      existing?.title ||
      existing?.original_title ||
      '';
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

    // Önceki filmin noktaları haritada kalmasın: yeni film için lokasyonları hemen temizle
    dispatch({
      type: GET_LOCATIONS,
      payload: { movieInfo: [], noMovie: false },
    });

    const locationsResponse = await axios.get(`/api/locations/${id}`);
    const apiTitle = locationsResponse.data?.title;
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

    // DB'den gelen hazır koordinatlı lokasyonlar (osm-geocoder); Geoapify/geocode atlanır
    if (locationsResponse.data.fromGeocodedDb && Array.isArray(locationsResponse.data.locations)) {
      movieInfo = locationsResponse.data.locations;
      dispatch({
        type: GEOCODE_PROGRESS_RESET,
        payload: { total: movieInfo.length },
      });
      dispatch({
        type: GEOCODE_PROGRESS_UPDATE,
        payload: {
          total: movieInfo.length,
          processed: movieInfo.length,
          found: movieInfo.filter((m) => m.Ycoor != null && m.Xcoor != null).length,
          status: 'done',
        },
      });
    } else if (
      !locationsResponse.data.locations ||
      locationsResponse.data.locations.length === 0 ||
      locationsResponse.data.locations === 'location not found'
    ) {
      const stateBefore = getState?.()?.MovieReducer;
      if (stateBefore?.movieDetails?.id === id && (stateBefore?.movieInfos?.length ?? 0) > 0) {
        return; // Aynı film için zaten lokasyon var (çift istek); boş cevabı yoksay
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
      locationsResponse.data.locations.map((res) => {
        const node = res.node;
        const qualifiers = node?.displayableProperty?.qualifiersInMarkdownList;
        const sceneOrType = Array.isArray(qualifiers) && qualifiers[0]?.markdown
          ? String(qualifiers[0].markdown).trim()
          : null;
        movieInfo.push({
          place: node?.location ?? '',
          desc: sceneOrType || 'No description available',
        });
      });

      dispatch({
        type: GEOCODE_PROGRESS_RESET,
        payload: { total: movieInfo.length },
      });

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

      for (let i = 0; i < movieInfo.length; i++) {
        await fetchOne(movieInfo[i], i);
        const processed = i + 1;
        const now = Date.now();
        if (now - lastProgressAt >= PROGRESS_THROTTLE_MS || processed === movieInfo.length) {
          lastProgressAt = now;
          const found = movieInfo.filter(
            (m) => m.Ycoor != null && m.Xcoor != null
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
      if (movieInfo.length > 0) {
        const found = movieInfo.filter(
          (m) => m.Ycoor != null && m.Xcoor != null
        ).length;
        dispatch({
          type: GEOCODE_PROGRESS_UPDATE,
          payload: {
            total: movieInfo.length,
            processed: movieInfo.length,
            found,
            status: 'done',
          },
        });
      }
    }

      dispatch({
        type: GET_LOCATIONS,
        payload: {
          movieInfo,
          noMovie,
          locationsSource: locationsResponse.data.fromGeocodedDb ? 'db' : 'web',
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
    const state = getState?.()?.MovieReducer;
    const currentId = state?.movieDetails?.id;
    const hasExistingLocations = Array.isArray(state?.movieInfos) && state.movieInfos.length > 0;
    // Aynı film için zaten lokasyonlar yüklüyse (örn. çift istekte ilki başarılı) state’i boşaltma
    if (currentId === id && hasExistingLocations) {
      if (error.response?.status === 429) {
        const alertify = await getAlertify();
        if (alertify) {
          alertify.set('notifier', 'position', 'top-right');
          alertify.warning('Too many requests. Please try again in a moment.');
        }
      }
      console.warn('Locations fetch failed but keeping existing locations for same movie:', id);
      return;
    }
    if (error.response?.status === 429) {
      const alertify = await getAlertify();
      if (alertify) {
        alertify.set('notifier', 'position', 'top-right');
        alertify.warning('Too many requests. Please try again in a moment.');
      }
      dispatch({
        type: GEOCODE_PROGRESS_RESET,
        payload: { total: 0 },
      });
      dispatch({
        type: GEOCODE_PROGRESS_UPDATE,
        payload: { total: 0, processed: 0, found: 0, status: 'done' },
      });
      dispatch({
        type: GET_LOCATIONS,
        payload: { movieInfo: [], noMovie: true, locationsSource: 'web' },
      });
    }
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
        payload: { movies: [], series: [], source: null },
      });
    } else {
      const movies = response.data?.movies ?? [];
      const series = response.data?.series ?? [];
      const source = response.data?.source ?? 'web';
      dispatch({
        type: FETCH_MOVIES,
        payload: { movies, series, source },
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
      payload: { movies: [], series: [], source: null },
    });
    dispatch({
      type: FETCH_MOVIES_LOADING,
      payload: false,
    });
  }
};

