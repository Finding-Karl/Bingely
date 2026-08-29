import { postgresApi } from './postgresApi';
import { UserProfile } from '../types/models';

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

export async function createUserProfile(params: {
  uid: string;
  username: string;
  displayName: string;
  email: string;
}): Promise<UserProfile> {
  // The backend derives the row's id from the caller's verified Firebase ID
  // token (see functions/src/index.ts's PUT /profile/me), not from a
  // client-supplied value - params.uid is kept in this signature only so it
  // still matches its one call site (AuthContext.tsx's signUp), which
  // already only ever calls this right after creating that same user.
  const row = await postgresApi.put<UserRow>('/profile/me', {
    username: params.username,
    usernameLower: params.username.trim().toLowerCase(),
    displayName: params.displayName,
    email: params.email,
  });
  return mapUserRow(row);
}

/**
 * The backend only exposes the signed-in caller's own profile
 * (GET /profile/me reads the row for the verified auth token's uid, there
 * is no "get any user's profile" route) - the one call site (Leaderboard's
 * self entry) already only ever passes the current user's own uid. Kept as
 * a parameter for parity with the old Firestore version.
 */
export async function getUserProfile(_uid: string): Promise<UserProfile | null> {
  const row = await postgresApi.get<UserRow | null>('/profile/me');
  return row ? mapUserRow(row) : null;
}
