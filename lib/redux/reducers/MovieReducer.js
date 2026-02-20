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
  locationsSource: null, // 'db' | 'web' — haritada kaynak badge için
  fMovies: { movies: [], series: [] },
  fMoviesLoading: false,
  searchSource: null, // 'db' | 'web' — arama sonuçları kaynağı (searchbar flag)
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
    case GET_LOCATIONS: {
      const isClear = !Array.isArray(action.payload.movieInfo) || action.payload.movieInfo.length === 0;
      const isNoMovie = Boolean(action.payload.noMovie);
      return {
        ...state,
        movieInfos: action.payload.movieInfo ?? state.movieInfos,
        noMovie: action.payload.noMovie ?? state.noMovie,
        locationsSource: action.payload.locationsSource ?? state.locationsSource,
        geocodeProgress: isClear && !isNoMovie
          ? { total: 0, processed: 0, found: 0, status: 'idle' }
          : { ...state.geocodeProgress, status: 'done' },
      };
    }
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
        fMovies: {
          movies: action.payload?.movies ?? state.fMovies.movies,
          series: action.payload?.series ?? state.fMovies.series,
        },
        searchSource: action.payload?.source ?? state.searchSource,
        fMoviesLoading: false,
      };
    default:
      return state;
  }
};

export default MovieReducer;

