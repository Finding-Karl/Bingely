import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin';
import { GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from '@env';

/**
 * True once a real Google OAuth web client ID has been dropped into .env -
 * see .env.example and GOOGLE_SIGNIN_SETUP.md. Screens use this to hide the
 * Google button entirely rather than show one that's guaranteed to fail.
 */
export const isGoogleSignInConfigured = Boolean(GOOGLE_WEB_CLIENT_ID);

if (isGoogleSignInConfigured) {
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    // [iOS] Normally read automatically from a GoogleService-Info.plist,
    // but this app doesn't ship one - it uses Firebase's JS/Web SDK
    // (src/services/firebase.ts), not the native Firebase SDKs, so the iOS
    // OAuth client id has to be supplied explicitly here instead.
    iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
  });
}

export interface GoogleSignInResult {
  idToken: string;
  name: string | null;
  email: string | null;
}

/**
 * Runs the native Google account picker and returns an ID token to hand to
 * Firebase (`GoogleAuthProvider.credential(idToken)`), or null if the user
 * backed out of the picker - that's a normal outcome, not an error, so
 * callers shouldn't show an error message for it.
 */
export async function signInWithGoogleNative(): Promise<GoogleSignInResult | null> {
  // No-op on iOS, but required before signIn() on Android - throws if Play
  // Services is missing/outdated (and can prompt the user to fix it).
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();
  if (!isSuccessResponse(response)) {
    return null;
  }
  const { idToken, user } = response.data;
  if (!idToken) {
    throw new Error(
      'Google did not return an ID token - check GOOGLE_WEB_CLIENT_ID in .env (see GOOGLE_SIGNIN_SETUP.md).',
    );
  }
  return { idToken, name: user.name, email: user.email };
}
