import { postgresApi } from './postgresApi';
import { UserProfile } from '../types/models';

export interface FollowingEntry {
  uid: string;
  username: string;
  displayName: string;
}

interface UserRow {
  id: string;
  username: string;
  username_lower: string;
  display_name: string;
  email: string;
  created_at: string;
}

function mapUserRow(row: UserRow): UserProfile {
  return {
    uid: row.id,
    username: row.username,
    usernameLower: row.username_lower,
    displayName: row.display_name,
    email: row.email,
    createdAt: new Date(row.created_at).getTime(),
  };
}

interface FollowingRow {
  uid: string;
  username: string;
  display_name: string;
  followed_at: string;
}

function mapFollowingRow(row: FollowingRow): FollowingEntry {
  return { uid: row.uid, username: row.username, displayName: row.display_name };
}

/**
 * Prefix search on the lowercased username. The backend does a real SQL
 * `LIKE` query and already excludes the caller's own row - Firestore's
 * version faked prefix matching with a `>=`/`<=` range query since it had
 * no `LIKE` equivalent.
 */
export async function searchUsers(queryText: string, _excludeUid: string): Promise<UserProfile[]> {
  const term = queryText.trim();
  if (!term) return [];
  const rows = await postgresApi.get<UserRow[]>(`/social/search?term=${encodeURIComponent(term)}`);
  return rows.map(mapUserRow);
}

export async function followUser(_uid: string, target: UserProfile): Promise<void> {
  // The backend scopes this write to the caller's verified uid (see
  // functions/src/index.ts's POST /social/follow) - uid is kept as a
  // parameter for parity with the old Firestore version, which needed it
  // to build a document path.
  await postgresApi.post('/social/follow', { followeeId: target.uid });
}

export async function unfollowUser(_uid: string, targetUid: string): Promise<void> {
  await postgresApi.delete(`/social/follow/${targetUid}`);
}

/**
 * The signed-in user's list of who they follow, most-recently-followed
 * first (the backend already orders this). Firestore's live subscription
 * (subscribeToFollowing) has no equivalent over a plain HTTP API - the one
 * caller (FriendsScreen) now fetches once on focus and keeps its own
 * optimistic local state for follow/unfollow instead of relying on a
 * subscription to reflect its own writes back.
 */
export async function getFollowing(_uid: string): Promise<FollowingEntry[]> {
  const rows = await postgresApi.get<FollowingRow[]>('/social/following');
  return rows.map(mapFollowingRow);
}
