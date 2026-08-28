export type MediaType = 'movie' | 'tv';

export interface Genre {
  id: number;
  name: string;
}

export interface Video {
  id: string;
  key: string; // YouTube video key
  name: string;
  site: string;
  type: string; // "Trailer" | "Teaser" | "Clip" | ...
}

export interface MovieSummary {
  id: number; // TMDB id
  mediaType: MediaType;
  title: string;
  posterPath: string | null;
  releaseYear: string | null;
  genreIds: number[];
}

export interface MovieDetails extends MovieSummary {
  overview: string;
  videos: Video[];
}

/** A single title a user has ranked, stored at users/{uid}/rankings/{id} */
export interface RankedItem {
  id: string;
  movieId: number;
  mediaType: MediaType;
  title: string;
  posterPath: string | null;
  genreIds: number[];
  score: number; // 1-10, user-assigned. MVP ranking signal (pairwise comparison is a future iteration).
  rankedAt: number; // epoch ms
}

/** Public profile, stored at users/{uid} */
export interface UserProfile {
  uid: string;
  username: string;
  usernameLower: string;
  displayName: string;
  email: string;
  createdAt: number;
}
