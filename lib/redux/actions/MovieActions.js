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
      dispatch({
        type: GET_POPULAR_MOVIES,
        payload: response.data,
      });
    })
    .catch((err) => {
      console.log('Error fetching popular movies:', err);
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
    const response = await axios.get(`/api/search-movie?query=${movieValue}`);

    dispatch({
      type: FETCH_MOVIES,
      payload: response.data,
    });
  } catch (error) {
    console.error('Error fetching movies:', error);
    dispatch({
      type: FETCH_MOVIES_LOADING,
      payload: false,
    });
  }
};

