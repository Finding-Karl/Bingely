import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from './firebase';
import { RankedItem } from '../types/models';

/**
 * Live subscription to a user's ranked titles, newest score-order first.
 * Filtering by genre / all-time is done client-side in the Dashboard screen
 * since per-user ranking counts are small for an MVP and this avoids
 * needing Firestore composite indexes for array-contains + orderBy.
 */
export function subscribeToRankings(
  uid: string,
  onChange: (items: RankedItem[]) => void,
): () => void {
  const rankingsQuery = query(collection(db, 'users', uid, 'rankings'), orderBy('score', 'desc'));
  return onSnapshot(rankingsQuery, snapshot => {
    onChange(
      snapshot.docs.map(document => ({
        id: document.id,
        ...(document.data() as Omit<RankedItem, 'id'>),
      })),
    );
  });
}
