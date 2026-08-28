import { Genre } from '../types/models';

/**
 * Static MVP genre list (TMDB genre ids), shared by movies and TV shows.
 * Good enough to slice "genre lists" without an extra network round trip;
 * can be replaced by TMDB's /genre/movie/list + /genre/tv/list later.
 */
export const GENRES: Genre[] = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 27, name: 'Horror' },
  { id: 10749, name: 'Romance' },
  { id: 10765, name: 'Sci-Fi & Fantasy' },
  { id: 53, name: 'Thriller' },
];

export const ALL_TIME_LIST_ID = 'all-time';
