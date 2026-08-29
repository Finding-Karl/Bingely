import { postgresApi } from './postgresApi';
import { RankedItem } from '../types/models';

interface RankingRow {
  id: string;
  user_id: string;
  movie_id: number;
  media_type: RankedItem['mediaType'];
  title: string;
  poster_path: string | null;
  genre_ids: number[] | null;
  score: number;
  ranked_at: string;
}

function mapRankingRow(row: RankingRow): RankedItem {
  return {
    id: row.id,
    movieId: row.movie_id,
    mediaType: row.media_type,
    title: row.title,
    posterPath: row.poster_path,
    genreIds: row.genre_ids ?? [],
    score: row.score,
    rankedAt: new Date(row.ranked_at).getTime(),
  };
}

/**
 * A user's ranked titles, newest-score-first (the backend already orders by
 * score DESC). Replaces the old Firestore live subscription - a plain HTTP
 * API has no equivalent, so the screens that showed this list (Dashboard,
 * FriendProfile) refetch on focus instead of subscribing (see
 * DashboardScreen.tsx / FriendProfileScreen.tsx). `/rankings/user/:uid`
 * works for both the signed-in user and any other user's rankings - same
 * read access the old Firestore rules granted.
 */
export async function getRankings(uid: string): Promise<RankedItem[]> {
  const rows = await postgresApi.get<RankingRow[]>(`/rankings/user/${uid}`);
  return rows.map(mapRankingRow);
}

export async function addRanking(
  _uid: string,
  item: {
    movieId: number;
    mediaType: RankedItem['mediaType'];
    title: string;
    posterPath: string | null;
    genreIds: number[];
    score: number;
  },
): Promise<string> {
  // The backend scopes this write to the caller's verified uid (see
  // functions/src/index.ts's PUT /rankings) - uid is kept as a parameter
  // for parity with the old Firestore version, which needed it to build a
  // document path.
  const row = await postgresApi.put<RankingRow>('/rankings', {
    movieId: item.movieId,
    mediaType: item.mediaType,
    title: item.title,
    posterPath: item.posterPath,
    genreIds: item.genreIds,
    score: item.score,
  });
  return row.id;
}

export async function getRankingsCount(uid: string): Promise<number> {
  const { count } = await postgresApi.get<{ count: number }>(`/rankings/count/${uid}`);
  return count;
}

/** The current user's existing rating for a title, or null if they haven't rated it. */
export async function getRanking(
  _uid: string,
  mediaType: RankedItem['mediaType'],
  movieId: number,
): Promise<RankedItem | null> {
  // Self-only on the backend (GET /rankings/mine/:mediaType/:movieId reads
  // the caller's own uid from the verified token) - the one call site
  // (MovieDetailScreen) already only ever passes the signed-in user's own
  // uid. Kept as a parameter for parity with the old Firestore version.
  const row = await postgresApi.get<RankingRow | null>(`/rankings/mine/${mediaType}/${movieId}`);
  return row ? mapRankingRow(row) : null;
}
