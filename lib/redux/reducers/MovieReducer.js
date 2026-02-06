import {
  GET_LOCATIONS,
  GET_MOVIE_DETAILS,
  FETCH_MOVIES,
  FETCH_MOVIES_LOADING,
  GEOCODE_PROGRESS_RESET,
  GEOCODE_PROGRESS_UPDATE
} from '../actions/ActionTypes';

const initialState = {
  version: 'v2.0',
  movieInfos: [],
  movieDetails: null,
  fMovies: { movies: [], series: [] },
  fMoviesLoading: false,
  noMovie: false,
  geocodeProgress: {
    total: 0,
    processed: 0,
    found: 0,
    status: 'idle', // idle | running | done
  },
};

const MovieReducer = (state = initialState, action) => {
  switch (action.type) {
    case GET_LOCATIONS:
      return {
        ...state,
        movieInfos: action.payload.movieInfo,
        noMovie: action.payload.noMovie,
        geocodeProgress: {
          ...state.geocodeProgress,
          status: 'done',
        },
      };
    case GEOCODE_PROGRESS_RESET:
      return {
        ...state,
        geocodeProgress: {
          total: action.payload?.total ?? 0,
          processed: 0,
          found: 0,
          status: 'running',
        },
      };
    case GEOCODE_PROGRESS_UPDATE:
      return {
        ...state,
        geocodeProgress: {
          ...state.geocodeProgress,
          processed: action.payload?.processed ?? state.geocodeProgress.processed,
          found: action.payload?.found ?? state.geocodeProgress.found,
          total: action.payload?.total ?? state.geocodeProgress.total,
          status: action.payload?.status ?? state.geocodeProgress.status,
        },
      };
    case GET_MOVIE_DETAILS:
      return {
        ...state,
        movieDetails: action.payload,
      };
    case FETCH_MOVIES_LOADING:
      return {
        ...state,
        fMoviesLoading: action.payload,
      };
    case FETCH_MOVIES:
      return {
        ...state,
        fMovies: action.payload ?? { movies: [], series: [] },
        fMoviesLoading: false,
      };
    default:
      return state;
  }
};

export default MovieReducer;

