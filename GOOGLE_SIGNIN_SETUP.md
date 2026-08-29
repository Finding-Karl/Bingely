# Google Sign-In setup

One-time manual setup for the "Sign in with Google" / "Sign up with Google"
buttons on the Login and Signup screens. Code-side, this uses
`@react-native-google-signin/google-signin` (the native Google account
picker) to get a Google ID token, then hands that to Firebase's `firebase/auth`
JS SDK (`GoogleAuthProvider.credential(idToken)` +
`signInWithCredential(auth, credential)`) - same `auth` instance the
email/password flow already uses, so `useAuth()`'s `user` updates the same
way either way.

The Google button is hidden entirely until `GOOGLE_WEB_CLIENT_ID` is set in
`.env` (see `src/services/googleAuth.ts`'s `isGoogleSignInConfigured`), so
skipping any of this doesn't break the existing email/password flow.

## Prerequisite

Google needs to already be enabled as a sign-in provider: Firebase Console
> Authentication > Sign-in method > Google > Enable. (Already done as of
this doc being written.)

## 1. Web client ID

Enabling Google above auto-creates an OAuth 2.0 **Web application** client
in the same Google Cloud project:

1. Go to Google Cloud Console > APIs & Services > Credentials, project
   `bingely-85e31`: `https://console.cloud.google.com/apis/credentials?project=bingely-85e31`
2. Find the entry named something like **"Web client (auto created by
   Google Service)"**. Copy its Client ID (looks like
   `1234567890-abc...xyz.apps.googleusercontent.com`).
3. Paste it into `.env` as:
   ```
   GOOGLE_WEB_CLIENT_ID=1234567890-abc...xyz.apps.googleusercontent.com
   ```

This is the only value that's strictly required - without it, the Google
button doesn't render at all (see above). The next two sections make it
work on each platform.

## 2. iOS: OAuth client + Info.plist URL scheme

This app uses Firebase's JS/Web SDK (not the native Firebase SDKs), so
there's no `GoogleService-Info.plist` in the project for the library to
read an iOS client ID from automatically - it has to be created and wired
in by hand:

1. Same Credentials page as above > **+ Create Credentials > OAuth client
   ID** > Application type **iOS**.
2. Bundle ID: `com.karlwng.bingely` (the real device build - see
   `PRODUCT_BUNDLE_IDENTIFIER[sdk=iphoneos*]` in
   `ios/bingely.xcodeproj/project.pbxproj`). If you test in the iOS
   Simulator, note its bundle ID is currently the generic
   `org.reactjs.native.example.bingely` placeholder instead - Google
   Sign-In will only work on whichever bundle ID you actually register
   here, so create a second iOS OAuth client for that one too if you need
   Simulator testing.
3. Copy the resulting Client ID into `.env`:
   ```
   GOOGLE_IOS_CLIENT_ID=1234567890-def...uvw.apps.googleusercontent.com
   ```
4. Add a URL scheme to `ios/bingely/Info.plist` (inside the top-level
   `<dict>`, anywhere alongside the other keys) built from that same
   client ID, reversed: take everything before `.apps.googleusercontent.com`
   and prefix it with `com.googleusercontent.apps.`. For the example
   above (`1234567890-def...uvw`), that's:
   ```xml
   <key>CFBundleURLTypes</key>
   <array>
     <dict>
       <key>CFBundleURLSchemes</key>
       <array>
         <string>com.googleusercontent.apps.1234567890-def...uvw</string>
       </array>
     </dict>
   </array>
   ```
   Use your actual client ID's prefix, not the example above. Without this
   step, tapping the Google button will open the sign-in flow but it won't
   be able to return control to the app afterward.

## 3. Android: OAuth client (SHA-1)

1. Get your debug keystore's SHA-1 fingerprint:
   ```
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```
   (Copy the `SHA1:` line.)
2. Same Credentials page > **+ Create Credentials > OAuth client ID** >
   Application type **Android**. Package name: `com.bingely` (see
   `android/app/build.gradle`'s `applicationId`). Paste in the SHA-1 from
   step 1.
3. No `.env` entry needed for this one - unlike iOS, the native module
   doesn't take an `androidClientId` in `GoogleSignin.configure()`; Android
   sign-in works once this SHA-1 + package name registration exists.
4. If you ever build a signed release APK/AAB, you'll need to repeat this
   with that keystore's SHA-1 too (a release build won't match the debug
   registration above).

## 4. Install and rebuild

The npm package (`@react-native-google-signin/google-signin`) is already
in `package.json` - this is a native module, so it needs the same kind of
install/rebuild as the icon font pod fix earlier:

```
cd ios && bundle exec pod install && cd ..
```

then a full clean rebuild (Xcode: Product > Clean Build Folder, then
run again; Android: `npx react-native run-android` picks up new native
deps automatically on the next build). A Metro/JS-only reload is **not**
enough for a native module like this one.

## Verifying

Once `.env` has `GOOGLE_WEB_CLIENT_ID` set, the Login and Signup screens
show an "or" divider and a Google button below the email form. Tapping it
opens the native Google account picker; picking an account signs you in
(and, if it's the first time that Google account has been used here,
creates a profile row via the same Postgres backend the email/password
flow uses - see `AuthContext.tsx`'s `signInWithGoogle`).
