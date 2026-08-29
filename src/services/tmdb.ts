import { TMDB_API_READ_TOKEN } from '@env';
import { MediaType, MovieDetails, MovieSummary, Video } from '../types/models';

const BASE_URL = 'https://api.themoviedb.org/3';
export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w342';

/** True once a real TMDB API read token has been dropped into .env (see .env.example). */
export const isTmdbConfigured = Boolean(TMDB_API_READ_TOKEN);

async function tmdbFetch(path: string, params: Record<string, string> = {}) {
  if (!isTmdbConfigured) {
    throw new Error(
      'TMDB_API_READ_TOKEN is not set. Add it to .env (see .env.example) and restart Metro.',
    );
  }
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${BASE_URL}${path}${query ? `?${query}` : ''}`, {
    headers: {
      Authorization: `Bearer ${TMDB_API_READ_TOKEN}`,
      accept: 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error(`TMDB request failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

function toSummary(raw: any, mediaType: MediaType): MovieSummary {
  return {
    id: raw.id,
    mediaType,
    title: raw.title ?? raw.name ?? 'Untitled',
    posterPath: raw.poster_path ?? null,
    releaseYear: (raw.release_date ?? raw.first_air_date ?? '').slice(0, 4) || null,
    genreIds: raw.genre_ids ?? (raw.genres ?? []).map((g: any) => g.id),
  };
}

export async function searchTitles(query: string): Promise<MovieSummary[]> {
  if (!query.trim()) return [];
  const data = await tmdbFetch('/search/multi', { query, include_adult: 'false' });
  return (data.results ?? [])
    .filter((r: any) => r.media_type === 'movie' || r.media_type === 'tv')
    .map((r: any) => toSummary(r, r.media_type));
}

export async function getTitleDetails(id: number, mediaType: MediaType): Promise<MovieDetails> {
  const data = await tmdbFetch(`/${mediaType}/${id}`, { append_to_response: 'videos' });
  const videos: Video[] = (data.videos?.results ?? [])
    .filter((v: any) => v.site === 'YouTube')
    .map((v: any) => ({ id: v.id, key: v.key, name: v.name, site: v.site, type: v.type }));

  return {
    ...toSummary(data, mediaType),
    overview: data.overview ?? '',
    videos,
  };
}

export async function discoverByGenre(genreId: number): Promise<MovieSummary[]> {
  // TMDB splits discover by media type, unlike /search/multi - fetch both
  // and merge by popularity so movies and shows interleave naturally.
  const params = {
    with_genres: String(genreId),
    include_adult: 'false',
    sort_by: 'popularity.desc',
  };
  const [movies, tv]: [any, any] = await Promise.all([
    tmdbFetch('/discover/movie', params),
    tmdbFetch('/discover/tv', params),
  ]);
  const tagged = [
    ...(movies.results ?? []).map((r: any) => ({ ...r, __mediaType: 'movie' as MediaType })),
    ...(tv.results ?? []).map((r: any) => ({ ...r, __mediaType: 'tv' as MediaType })),
  ];
  tagged.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
  return tagged.map((r) => toSummary(r, r.__mediaType));
}

export function posterUrl(path: string | null): string | undefined {
  return path ? `${TMDB_IMAGE_BASE}${path}` : undefined;
}
