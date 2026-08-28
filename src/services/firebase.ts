import AsyncStorage from '@react-native-async-storage/async-storage';
import { decode, encode } from 'base-64';
import { FirebaseOptions, getApp, getApps, initializeApp } from 'firebase/app';
// `@firebase/auth`'s package.json lists a `"types"` condition ahead of its
// `"react-native"` condition in the exports map, so both Metro's and TS's
// resolvers stop at the generic (non-RN) declaration file before ever reaching
// the RN-specific one - even though Metro's *runtime* resolution (which ignores
// the non-matching "types" condition) correctly loads the real RN build with a
// working `getReactNativePersistence`. This is a types-only gap in the
// published package, not a bug in this app - see firebase-js-sdk#7592.
import { initializeAuth } from '@firebase/auth';
// @ts-expect-error - not in the resolved .d.ts (see comment above); exists at runtime.
import { getReactNativePersistence } from '@firebase/auth';
import { FirestoreSettings, initializeFirestore } from 'firebase/firestore';
import {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
} from '@env';

// React Native's JS runtime doesn't support the streaming networking APIs
// (WebSocket / fetch streams) that Firestore's default transport uses, which
// surfaces as spurious "Failed to get document because the client is
// offline" errors even on a perfectly good connection. Forcing long-polling
// is the standard fix for RN. That transport also expects a couple of
// browser globals Hermes doesn't provide, so polyfill them defensively.
const rnGlobal = globalThis as any;
if (typeof rnGlobal.btoa === 'undefined') {
  rnGlobal.btoa = encode;
}
if (typeof rnGlobal.atob === 'undefined') {
  rnGlobal.atob = decode;
}
if (typeof rnGlobal.DOMException === 'undefined') {
  class DOMExceptionPolyfill extends Error {
    constructor(message?: string, name = 'Error') {
      super(message);
      this.name = name;
    }
  }
  rnGlobal.DOMException = DOMExceptionPolyfill;
}

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

// Persist the auth session to AsyncStorage so a JS reload / app restart
// doesn't silently sign the user out. Without this, `getAuth()` defaults to
// in-memory-only persistence - every reload looks like a fresh install, and
// re-signing-up lands on a brand-new (empty) account while the old one's
// data sits untouched in Firestore.
export const auth = initializeAuth(firebaseApp, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// `experimentalForceLongPolling` isn't in the public FirestoreSettings type
// (it's considered "experimental"), but the SDK honors it at runtime - this
// is the documented workaround for React Native. See:
// https://github.com/firebase/firebase-js-sdk/issues/7115
const firestoreSettings: FirestoreSettings & { experimentalForceLongPolling?: boolean } = {
  experimentalForceLongPolling: true,
};

export const db = initializeFirestore(firebaseApp, firestoreSettings);
