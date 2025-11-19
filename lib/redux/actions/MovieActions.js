'use client';

import { GET_POPULAR_MOVIES, GET_POPULAR_MOVIES_LOADING, GET_LOCATIONS, GET_POSTER, FETCH_MOVIES, FETCH_MOVIES_LOADING } from './ActionTypes';
import axios from 'axios';

// alertifyjs'i dinamik olarak import et (SSR hatası önlemek için)
const getAlertify = () => {
  if (typeof window !== 'undefined') {
    return require('alertifyjs');
  }
  return null;
};

export const getPopularMovies = () => (dispatch) => {
  dispatch({
    type: GET_POPULAR_MOVIES_LOADING,
    payload: true,
  });
  
  axios
    .get('/api/popular-movies')
    .then((response) => {
      if (response.status === 503) {
        const alertify = getAlertify();
        if (alertify) {
          alertify.set('notifier', 'position', 'top-right');
          alertify.warning('Movie service is currently unavailable. Please check your API configuration.');
        }
        dispatch({
          type: GET_POPULAR_MOVIES,
          payload: [],
        });
      } else {
        dispatch({
          type: GET_POPULAR_MOVIES,
          payload: response.data || [],
        });
      }
      dispatch({
        type: GET_POPULAR_MOVIES_LOADING,
        payload: false,
      });
    })
    .catch((err) => {
      console.error('Error fetching popular movies:', err.response?.data || err.message || err);
      const alertify = getAlertify();
      if (alertify) {
        alertify.set('notifier', 'position', 'top-right');
        if (err.response?.status === 503) {
          alertify.error('Movie service is currently unavailable.');
        } else {
          alertify.error('Failed to load movies. Please try again later.');
        }
      }
      dispatch({
        type: GET_POPULAR_MOVIES,
        payload: [],
      });
      dispatch({
        type: GET_POPULAR_MOVIES_LOADING,
        payload: false,
      });
    });
};

export const getPoster = (poster_path) => (dispatch) => {
  dispatch({
    type: GET_POSTER,
    payload: poster_path
  });
};

export const getLocations = (id) => async (dispatch) => {
  const movieID = [];
  const movieInfo = [];
  let noMovie = false;

  try {
    const movieResponse = await axios.get(`/api/movie/${id}`);

    if (!movieResponse.data.imdb_id) {
      const alertify = getAlertify();
      if (alertify) alertify.error('Movie ID not found.');
      return;
    }

    const imdbid = { imdbid: movieResponse.data.imdb_id };
    movieID.push(imdbid);

    const locationsResponse = await axios.get(`/api/imdbid/${movieID[0].imdbid}`);

    if (
      !locationsResponse.data.locations ||
      locationsResponse.data.locations.length === 0 ||
      locationsResponse.data.locations === 'location not found'
    ) {
      const alertify = getAlertify();
      if (alertify) {
        alertify.set('notifier', 'position', 'top-right');
        alertify.error('No location found for this movie.');
      }
      noMovie = true;
    } else {
      locationsResponse.data.locations.map((res) => {
        movieInfo.push({
          place: res.node.location,
          desc:
            res.node?.displayableProperty?.qualifiersInMarkdownList?.[0]
              ?.markdown || 'No description available',
        });
      });

      await Promise.all(
        movieInfo.map(async (movie, index) => {
          try {
            const geoResponse = await axios.get(
              `/api/geocode?place=${encodeURIComponent(movie.place)}`
            );

            movie.Xcoor = geoResponse.data.Xcoor;
            movie.Ycoor = geoResponse.data.Ycoor;
            movie.index = index;
          } catch (error) {
            console.log('Error fetching geolocation:', error);
          }
        })
      );
    }

    dispatch({
      type: GET_LOCATIONS,
      payload: {
        movieInfo,
        noMovie,
      },
    });
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
    const response = await axios.get(`/api/search-movie?query=${encodeURIComponent(movieValue)}`);

    if (response.status === 503) {
      const alertify = getAlertify();
      if (alertify) {
        alertify.set('notifier', 'position', 'top-right');
        alertify.warning('Movie service is currently unavailable. Please check your API configuration.');
      }
      dispatch({
        type: FETCH_MOVIES,
        payload: [],
      });
    } else {
      dispatch({
        type: FETCH_MOVIES,
        payload: response.data || [],
      });
    }
    dispatch({
      type: FETCH_MOVIES_LOADING,
      payload: false,
    });
  } catch (error) {
    console.error('Error fetching movies:', error.response?.data || error.message || error);
    const alertify = getAlertify();
    if (alertify) {
      alertify.set('notifier', 'position', 'top-right');
      if (error.response?.status === 503) {
        alertify.error('Movie service is currently unavailable.');
      } else {
        alertify.error('Failed to search movies. Please try again later.');
      }
    }
    dispatch({
      type: FETCH_MOVIES,
      payload: [],
    });
    dispatch({
      type: FETCH_MOVIES_LOADING,
      payload: false,
    });
  }
};

