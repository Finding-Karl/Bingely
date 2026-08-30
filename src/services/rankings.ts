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
  // The DB column is NUMERIC(3,1) (to support tenths, e.g. 7.3) - node-
  // postgres returns numeric/decimal columns as strings, not JS numbers,
  // to avoid silent precision loss, so this arrives here as e.g. "7.3".
  score: number | string;
  review: string | null;
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
    score: Number(row.score),
    review: row.review ?? null,
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
    review?: string | null;
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
    review: item.review ?? null,
  });
  return row.id;
}

export async function getRankingsCount(uid: string): Promise<number> {
  const { count } = await postgresApi.get<{ count: number }>(`/rankings/count/${uid}`);
  return count;
}

export async function deleteRanking(
  _uid: string,
  mediaType: RankedItem['mediaType'],
  movieId: number,
): Promise<void> {
  // Self-only on the backend (DELETE /rankings/mine/:mediaType/:movieId
  // scopes to the caller's own uid from the verified token) - uid is kept
  // as a parameter for parity with the other functions in this file.
  await postgresApi.delete(`/rankings/mine/${mediaType}/${movieId}`);
}

export interface FriendReview {
  uid: string;
  username: string;
  displayName: string;
  score: number;
  review: string | null;
  rankedAt: number;
}

interface FriendRankingRow extends RankingRow {
  username: string;
  display_name: string;
}

function mapFriendRankingRow(row: FriendRankingRow): FriendReview {
  return {
    uid: row.user_id,
    username: row.username,
    displayName: row.display_name,
    score: Number(row.score),
    review: row.review ?? null,
    rankedAt: new Date(row.ranked_at).getTime(),
  };
}

/**
 * The caller's friends' (people they follow) ratings/reviews for one
 * specific title, score DESC - powers TitleReviewsScreen's "friends'
 * reviews" list, reached by tapping a title on the Dashboard.
 */
export async function getFriendsRankingsForTitle(
  mediaType: RankedItem['mediaType'],
  movieId: number,
): Promise<FriendReview[]> {
  const rows = await postgresApi.get<FriendRankingRow[]>(`/rankings/friends/${mediaType}/${movieId}`);
  return rows.map(mapFriendRankingRow);
}

/**
 * Reorders a group of the caller's own rankings that share the same score
 * (a "tie group") - press-and-hold drag on the Dashboard calls this on
 * drop. `orderedIds` is that group's ranking ids in the new top-to-bottom
 * order; the backend turns that into `priority` values used as the tie-
 * break after score in every GET /rankings/* query (see
 * functions/src/index.ts's POST /rankings/reorder).
 */
export async function reorderRankings(orderedIds: string[]): Promise<void> {
  await postgresApi.post<void>('/rankings/reorder', { orderedIds });
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
