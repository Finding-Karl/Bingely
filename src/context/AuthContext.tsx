import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  GoogleAuthProvider,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  getAdditionalUserInfo,
  onAuthStateChanged,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { createUserProfile } from '../services/userProfile';
import { signInWithGoogleNative } from '../services/googleAuth';

interface AuthContextValue {
  user: FirebaseUser | null;
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, firebaseUser => {
      setUser(firebaseUser);
      setInitializing(false);
    });
    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initializing,
      signIn: async (email, password) => {
        await signInWithEmailAndPassword(auth, email, password);
      },
      signUp: async (email, password, username) => {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        // Same reasoning as MovieDetailScreen's save flow: don't block on
        // Firestore's write-acknowledgment round trip, just log if it
        // genuinely fails. onAuthStateChanged already lets the user into
        // the app as soon as the account exists.
        createUserProfile({
          uid: credential.user.uid,
          username,
          displayName: username,
          email,
        }).catch(error => {
          console.error('createUserProfile failed:', error);
        });
      },
      signInWithGoogle: async () => {
        const googleResult = await signInWithGoogleNative();
        if (!googleResult) {
          // User backed out of the account picker - not an error.
          return;
        }
        const credential = GoogleAuthProvider.credential(googleResult.idToken);
        const userCredential = await signInWithCredential(auth, credential);
        if (getAdditionalUserInfo(userCredential)?.isNewUser) {
          // First time this Google account has signed in here - create the
          // matching profile row, same as signUp above. Google doesn't
          // collect a "username" the way our sign-up form does, so default
          // it from the email address (same fallback the Settings "Test
          // Postgres backend" button already used) and let the user change
          // it later if/when a profile-editing screen exists.
          const email = userCredential.user.email ?? googleResult.email ?? '';
          const username = email ? email.split('@')[0] : `user_${userCredential.user.uid.slice(0, 8)}`;
          createUserProfile({
            uid: userCredential.user.uid,
            username,
            displayName: googleResult.name || username,
            email,
          }).catch(error => {
            console.error('createUserProfile failed:', error);
          });
        }
      },
      signOut: async () => {
        await firebaseSignOut(auth);
      },
    }),
    [user, initializing],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
