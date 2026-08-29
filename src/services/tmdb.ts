import { TMDB_API_READ_TOKEN } from '@env';
import { MediaType, MovieDetails, MovieSummary, Video } from '../types/models';
import { GENRE_DISCOVER_IDS } from '../constants/genreDiscoverIds';

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

export interface GenrePage {
  results: MovieSummary[];
  hasMore: boolean;
}

/**
 * One page of a genre's titles, newest release first. TMDB splits
 * /discover by media type and uses a different genre taxonomy for each
 * (see GENRE_DISCOVER_IDS) - a category with no equivalent id in one
 * taxonomy skips that endpoint rather than querying it with a bogus id.
 * sort_by asks TMDB itself to order each endpoint's results by date, so
 * paging through results (see GenreResultsScreen's onEndReached) stays
 * roughly newest-first across pages; the merge below re-sorts each page's
 * movie+TV results together since the two endpoints' own orderings can't
 * be interleaved by TMDB itself.
 */
export async function discoverByGenre(genreId: number, page: number = 1): Promise<GenrePage> {
  const ids = GENRE_DISCOVER_IDS[genreId] ?? { movie: String(genreId), tv: String(genreId) };

  // Only titles already out this year: from Jan 1 of the current year
  // through today, so nothing from prior years and nothing not yet
  // released slips in. Computed fresh each call rather than once at
  // module load, so a screen left open across a year boundary or a
  // midnight rollover still gets the right window.
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const yearStartStr = `${today.getFullYear()}-01-01`;

  const requests: Promise<{ mediaType: MediaType; items: any[]; totalPages: number }>[] = [];
  if (ids.movie) {
    requests.push(
      tmdbFetch('/discover/movie', {
        with_genres: ids.movie,
        include_adult: 'false',
        sort_by: 'primary_release_date.desc',
        'primary_release_date.gte': yearStartStr,
        'primary_release_date.lte': todayStr,
        page: String(page),
      }).then((data: any) => ({
        mediaType: 'movie',
        items: data.results ?? [],
        totalPages: data.total_pages ?? 1,
      })),
    );
  }
  if (ids.tv) {
    requests.push(
      tmdbFetch('/discover/tv', {
        with_genres: ids.tv,
        include_adult: 'false',
        sort_by: 'first_air_date.desc',
        'first_air_date.gte': yearStartStr,
        'first_air_date.lte': todayStr,
        page: String(page),
      }).then((data: any) => ({
        mediaType: 'tv',
        items: data.results ?? [],
        totalPages: data.total_pages ?? 1,
      })),
    );
  }

  const batches = await Promise.all(requests);
  const tagged = batches
    .flatMap(batch => batch.items.map((r: any) => ({ ...r, __mediaType: batch.mediaType })))
    // Defensive - the gte/lte params above should already guarantee this,
    // but a title with no date at all (rare, but TMDB data isn't perfect)
    // shouldn't slip through as "current year".
    .filter(r => {
      const date = r.release_date || r.first_air_date;
      return Boolean(date) && date >= yearStartStr && date <= todayStr;
    });
  tagged.sort((a, b) => {
    const dateA = a.release_date || a.first_air_date;
    const dateB = b.release_date || b.first_air_date;
    return dateB.localeCompare(dateA);
  });

  return {
    results: tagged.map(r => toSummary(r, r.__mediaType)),
    hasMore: batches.some(batch => page < batch.totalPages),
  };
}

export function posterUrl(path: string | null): string | undefined {
  return path ? `${TMDB_IMAGE_BASE}${path}` : undefined;
}
