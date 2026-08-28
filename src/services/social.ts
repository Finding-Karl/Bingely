import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile } from '../types/models';

export interface FollowingEntry {
  uid: string;
  username: string;
  displayName: string;
}

/** Prefix search on the lowercased username - good enough without a search index. */
export async function searchUsers(queryText: string, excludeUid: string): Promise<UserProfile[]> {
  const term = queryText.trim().toLowerCase();
  if (!term) return [];
  const usersQuery = query(
    collection(db, 'users'),
    orderBy('usernameLower'),
    where('usernameLower', '>=', term),
    where('usernameLower', '<=', term + '\uf8ff'),
    limit(20),
  );
  const snapshot = await getDocs(usersQuery);
  return snapshot.docs
    .map(document => document.data() as UserProfile)
    .filter(profile => profile.uid !== excludeUid);
}

export async function followUser(uid: string, target: UserProfile): Promise<void> {
  const entry: FollowingEntry & { followedAt: number } = {
    uid: target.uid,
    username: target.username,
    displayName: target.displayName,
    followedAt: Date.now(),
  };
  await setDoc(doc(db, 'users', uid, 'following', target.uid), entry);
}

export async function unfollowUser(uid: string, targetUid: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'following', targetUid));
}

export function subscribeToFollowing(
  uid: string,
  onChange: (entries: FollowingEntry[]) => void,
): () => void {
  const followingQuery = query(
    collection(db, 'users', uid, 'following'),
    orderBy('followedAt', 'desc'),
  );
  return onSnapshot(followingQuery, snapshot => {
    onChange(snapshot.docs.map(document => document.data() as FollowingEntry));
  });
}

export async function getFollowing(uid: string): Promise<FollowingEntry[]> {
  const snapshot = await getDocs(
    query(collection(db, 'users', uid, 'following'), orderBy('followedAt', 'desc')),
  );
  return snapshot.docs.map(document => document.data() as FollowingEntry);
}
