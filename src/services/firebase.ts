import { initializeApp, getApps, getApp, FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
} from '@env';

const firebaseConfig: FirebaseOptions = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
};

/** True once real Firebase config has been dropped into .env (see .env.example). */
export const isFirebaseConfigured = Boolean(FIREBASE_API_KEY && FIREBASE_PROJECT_ID);

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

// NOTE (MVP): using the default in-memory auth persistence. Sessions won't
// survive an app restart yet - wiring AsyncStorage-backed persistence is a
// good fast-follow once a real Firebase project is connected.
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
