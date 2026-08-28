import { collection, doc, getDocs, onSnapshot, orderBy, query, setDoc } from 'firebase/firestore';
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

export async function addRanking(
  uid: string,
  item: {
    movieId: number;
    mediaType: RankedItem['mediaType'];
    title: string;
    posterPath: string | null;
    genreIds: number[];
    score: number;
  },
): Promise<string> {
  const id = `${item.mediaType}-${item.movieId}`;
  await setDoc(doc(db, 'users', uid, 'rankings', id), {
    movieId: item.movieId,
    mediaType: item.mediaType,
    title: item.title,
    posterPath: item.posterPath,
    genreIds: item.genreIds,
    score: item.score,
    rankedAt: Date.now(),
  });
  return id;
}

export async function getRankingsCount(uid: string): Promise<number> {
  const snapshot = await getDocs(collection(db, 'users', uid, 'rankings'));
  return snapshot.docs.length;
}
