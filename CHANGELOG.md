# Changelog

All notable changes to this project are documented here, grouped by the
version in `package.json`. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versioning follows [Semantic Versioning](https://semver.org/) (see the
policy in the README / below for how that applies pre-1.0).

## [Unreleased]

Changes that have merged (or are about to) but haven't been bundled into a
version bump yet go here. When you're ready to cut a release, this section
gets renamed to the new version number and dated, and a fresh empty
`Unreleased` goes back on top.

### Added
- Retry transient "client is offline" errors on one-shot Firestore reads
  (getUserProfile, getRankingsCount, getRanking, getFollowing, searchUsers)
  instead of failing on the first cold-start race - see the code comment in
  `src/services/firestoreRetry.ts` for the root cause.
- Light mode is now the default appearance, with a Dark Mode toggle under
  Profile > Settings (persisted across restarts). Previously the app was
  hardcoded to a single dark palette everywhere.
- Bottom tab bar icons (Ionicons via @react-native-vector-icons) matching
  each tab's function: a list icon for Dashboard, a magnifying glass for
  Search, people for Friends, a trophy for Leaderboard, and a profile
  circle for Profile. Outline glyph when a tab is inactive, filled when
  active - the standard iOS tab bar convention. Previously the tab bar had
  no icons at all, just text labels.
- Swipe left on a Dashboard row to reveal a delete button and remove that
  title from your list. Built on React Native's built-in Animated/
  PanResponder (`src/components/SwipeToDelete.tsx`) rather than
  react-native-gesture-handler, since that library isn't installed in this
  app and adding it means another native-module install/rebuild - same
  class of step as the icon font pod issue earlier. Deleting requires an
  explicit tap on the revealed button (not a fast full swipe) so it can't
  happen by accident; the removal is optimistic (the row disappears
  immediately) with a rollback if the request fails. Backed by a new
  `DELETE /rankings/mine/:mediaType/:movieId` route on the Cloud Function
  (`functions/`) - **requires a `firebase deploy --only functions` to pick
  up the new route**, same as any other `functions/` change.
- Sign in / sign up with Google, alongside the existing email/password
  form, on both the Login and Signup screens. Uses
  `@react-native-google-signin/google-signin` (a native module - see
  `GOOGLE_SIGNIN_SETUP.md` for the one-time Google Cloud Console + Info.plist
  + pod install/rebuild setup this needs) to get a native Google ID token,
  then exchanges it for a Firebase session via
  `GoogleAuthProvider.credential()` + `signInWithCredential()` - the same
  `firebase/auth` instance and `useAuth()` state the email/password flow
  already uses. The first time a given Google account signs in, a profile
  row is created via the existing Postgres backend, same as email/password
  sign-up, with the username defaulted from the email address (Google
  doesn't collect a username). The button is hidden entirely until
  `GOOGLE_WEB_CLIENT_ID` is set in `.env`, so this doesn't affect anyone
  who hasn't done that setup yet.
- A "Browse by Genre" grid on the Search tab's landing state (shown before
  you type a query): a 2-column grid of genre cards (Action, Comedy, Drama,
  etc.), each a bordered surface with a single Ionicons outline glyph and
  the genre name - deliberately plain, content-and-hierarchy-first design
  in the spirit of Atlassian's card components (atlassian.design/components)
  rather than illustrated/color-block genre art. Tapping a card pushes a
  new `GenreResults` screen listing movies and TV shows in that genre,
  newest first, via two parallel TMDB `/discover/movie` and `/discover/tv`
  calls (`discoverByGenre` in `src/services/tmdb.ts` - TMDB splits discover
  by media type, unlike `/search/multi`) merged and sorted by release date
  and rendered with the same `MovieCard` used elsewhere. New files:
  `src/constants/genreIcons.ts` (genre id -> Ionicons glyph map),
  `src/components/GenreCard.tsx`, `src/screens/GenreResultsScreen.tsx`.

### Fixed
- `pod install` failing with "cannot yet be integrated as static libraries"
  after adding Google Sign-In - `AppCheckCore` (a transitive dependency of
  the native Google Sign-In SDK) is a Swift pod whose own dependencies,
  `GoogleUtilities` and `RecaptchaInterop`, don't define modules by default,
  which static linking (this project's default - no `use_frameworks!`)
  requires. Fixed by opting those two pods into modular headers explicitly
  in `ios/Podfile`, rather than the global `use_modular_headers!` (which can
  cause its own conflicts with other pods).
- The "Continue with Google" button used the library's native
  `GoogleSigninButton`, which doesn't match this app's button styling
  (different font size, and its fixed intrinsic width didn't track the
  100%-width style override, leaving it visibly off-center). Replaced with
  the same `AppButton` component every other auth action already uses -
  `AppButton` gained an optional `icon` prop (Ionicons `logo-google` here)
  to support this.
- The Dashboard/Search/Friends/Leaderboard/Profile tab headers ("Your
  Lists", "Search", etc.) sat right up against the status bar/notch on
  some devices - each screen's top-level container used a fixed
  `paddingTop` (`spacing.lg`, 24px) instead of accounting for the actual
  safe area. Switched each screen's root `View` to `SafeAreaView` (from
  `react-native-safe-area-context`, already a dependency but previously
  unused - only `SafeAreaProvider` was set up at the root) with
  `edges={['top']}`, which adds the device's real top inset on top of the
  existing `paddingTop` rather than replacing it, so headers now clear the
  notch/clock with some breathing room instead of sitting flush against it.

### In progress: moving rankings/profiles/follows off Firestore to Postgres
- `spike/sql-connect-graphql-poc` (merged) proved React Native could talk
  to Firebase SQL Connect directly via a hand-written GraphQL client
  (`src/services/dataConnect.ts`, since removed), since SQL Connect has no
  official RN SDK. That approach was then abandoned: SQL Connect's own
  schema-migration tooling turned out to be broken for this project
  (`firebase deploy --only dataconnect` / `dataconnect:sql:migrate` both
  404 on an internal experimental endpoint, reproduced on the latest
  firebase-tools) - a platform-side gap, not fixable here.
- `feature/postgres-cloud-function-backend`: pivoted to a Cloud Functions
  backend (`functions/`, Express + a standard Postgres client) in front of
  the same already-provisioned Cloud SQL instance, sidestepping SQL
  Connect's tooling entirely. `src/services/postgresApi.ts` is the new,
  much simpler RN-side client (a real `Authorization: Bearer` header this
  time, since it's our own API). See `functions/SETUP.md` for the one-time
  manual setup (DB user, table DDL, secret, deploy). Not wired into any
  screen yet - `userProfile.ts`/`rankings.ts`/`social.ts` still read/write
  Firestore; that's the next step once the backend is deployed and
  verified.
- `feature/postgres-user-profile-rankings`: `userProfile.ts` and
  `rankings.ts` now call the Cloud Function backend instead of Firestore,
  same exported function signatures as before. Postgres rows come back
  snake_case (`display_name`, `ranked_at`, ...) - each service file maps
  its rows to the existing camelCase model types (`UserProfile`,
  `RankedItem`), including converting the `TIMESTAMPTZ` columns' ISO
  strings back to the epoch-ms numbers those types use.
  `subscribeToRankings`'s live Firestore subscription is gone (a plain
  HTTP API has no equivalent) - it's replaced by `getRankings`, a one-shot
  fetch that Dashboard and FriendProfile now call on screen focus
  (`useFocusEffect`) instead of subscribing once on mount; Dashboard also
  gained pull-to-refresh. FriendProfileScreen, which previously had no
  loading state (Firestore's listener just fires once data is cached),
  now shows a spinner while its first fetch is in flight. MovieDetailScreen's
  save flow now awaits the write instead of firing it and moving on -
  Firestore used to apply writes to a local cache immediately regardless of
  the network, which is what made the old fire-and-forget version feel
  instant; a plain HTTP call has no such cache, so not awaiting it risked a
  race where navigating back to the Dashboard could refetch before the
  write had actually landed and show a stale list.
- `feature/postgres-social`: `social.ts` now calls the Cloud Function
  backend instead of Firestore, same exported function signatures as
  before. `searchUsers` uses a real SQL `LIKE` prefix match (the backend
  already excludes the caller's own row) instead of Firestore's `>=`/`<=`
  range-query workaround. `subscribeToFollowing`'s live subscription is
  gone - `getFollowing` is a one-shot fetch, and FriendsScreen (its one
  caller) now fetches once on focus plus keeps its own optimistic local
  state for follow/unfollow (flips the button immediately, rolls back on a
  failed request) instead of relying on a subscription to reflect its own
  writes back. LeaderboardScreen needed no changes - it already only calls
  these functions by their existing Promise-returning signatures.

## [0.1.0] - 2026-08-28

First feature-complete MVP: all five core flows working end to end, plus
the stability fixes found while dogfooding on a real device.

### Added
- Email/password sign up and log in, bottom-tab shell for the signed-in app.
- Dashboard showing the signed-in user's ranked titles, filterable by genre
  plus an all-time list.
- Movie/show search and detail screen via TMDB, embedded trailer playback,
  rate-and-add-to-list flow.
- Follow/unfollow friends by username search, and view a friend's ranked
  lists (read-only dashboard).
- Leaderboard tab ranked by number of titles logged, self + followed
  friends, pull-to-refresh.

### Fixed
- `FirebaseError: Failed to get document because the client is offline` -
  Firestore's default streaming transport isn't supported in RN's JS
  runtime. Forced long polling (`experimentalForceLongPolling`) and
  polyfilled the browser globals (`btoa`/`atob`/`DOMException`) that
  transport expects.
- "Add to List" spinning indefinitely - Firestore write promises only
  resolve on full server acknowledgment, not the local-cache commit that
  happens instantly. Writes (`addRanking`, `createUserProfile`,
  `followUser`, `unfollowUser`) are now fire-and-forget with a `.catch()`
  for genuine failures, instead of blocking the UI on the round trip.
- Movie detail screen not reflecting an existing rating - it now pre-fills
  the rating on load and shows "Update Rating" instead of "Add to My List"
  when one exists.
- Rated movies appearing to "disappear" after every reload - `getAuth()`
  defaulted to in-memory-only session persistence, so every JS reload
  silently logged the user out; signing up again instead of logging back
  in landed on a brand-new empty account while the old one's ratings sat
  untouched in Firestore. Switched to `initializeAuth` +
  `getReactNativePersistence(AsyncStorage)` so sessions survive reloads.
- Leaderboard and friend search failing silently with an uncaught promise
  rejection ("client is offline") - one-shot `getDoc`/`getDocs` reads can
  spuriously reject while the long-poll transport is still warming up.
  Both now catch the failure and show a plain-language message instead of
  hanging or crashing silently.
