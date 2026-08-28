import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile } from '../types/models';

export async function createUserProfile(params: {
  uid: string;
  username: string;
  displayName: string;
  email: string;
}): Promise<UserProfile> {
  const profile: UserProfile = {
    ...params,
    usernameLower: params.username.trim().toLowerCase(),
    createdAt: Date.now(),
  };
  await setDoc(doc(db, 'users', params.uid), profile);
  return profile;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snapshot = await getDoc(doc(db, 'users', uid));
  return snapshot.exists() ? (snapshot.data() as UserProfile) : null;
}
