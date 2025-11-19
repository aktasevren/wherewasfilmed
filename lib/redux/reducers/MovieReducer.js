import {
  GET_LOCATIONS,
  GET_POPULAR_MOVIES,
  GET_POPULAR_MOVIES_LOADING,
  GET_POSTER,
  FETCH_MOVIES,
  FETCH_MOVIES_LOADING
} from '../actions/ActionTypes';

const initialState = {
  version: 'v2.0',
  selectedMovieID: '',
  popularMovies: [],
  popularMoviesLoading: false,
  movieInfos: [],
  poster: '',
  fMovies: [],
  fMoviesLoading: false,
  noMovie: false,
};

const MovieReducer = (state = initialState, action) => {
  switch (action.type) {
    case GET_POPULAR_MOVIES_LOADING:
      return {
        ...state,
        popularMoviesLoading: action.payload,
      };
    case GET_POPULAR_MOVIES:
      return {
        ...state,
        popularMovies: action.payload,
        popularMoviesLoading: false,
      };
    case GET_LOCATIONS:
      return {
        ...state,
        movieInfos: action.payload.movieInfo,
        noMovie: action.payload.noMovie
      };
    case GET_POSTER:
      return {
        ...state,
        poster: action.payload,
      };
    case FETCH_MOVIES_LOADING:
      return {
        ...state,
        fMoviesLoading: action.payload,
      };
    case FETCH_MOVIES:
      return {
        ...state,
        fMovies: action.payload,
        fMoviesLoading: false,
      };
    default:
      return state;
  }
};

export default MovieReducer;

