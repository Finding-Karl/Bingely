# Changelog

Every unit of work gets its own branch and its own entry here, newest first.
An entry is added in the same commit as the change it describes. Once a
branch is merged, move its entry from **Unreleased** down into a dated
**Merged** section (or just leave it under Unreleased with a `(merged)`
note - either is fine, consistency matters less than not skipping entries).

This is a running dev log for an MVP that hasn't shipped yet, not a
user-facing release changelog, so entries describe *what changed and why*
rather than semver-style version bumps.

## Unreleased

### fix/handle-firestore-read-errors
- `LeaderboardScreen.load()` and `FriendsScreen`'s username search now catch
  Firestore read failures instead of leaving them as uncaught promise
  rejections. A one-shot `getDoc`/`getDocs` read can spuriously reject with
  "client is offline" while the long-poll transport is still warming up
  (e.g. right after a reload); previously that just spammed the console and
  left the UI stuck (frozen leaderboard spinner, search that stopped
  responding). Now it's caught, logged, and shown as a plain-language
  message.

### fix/auth-persistence
- Firebase Auth now persists the session to `AsyncStorage`
  (`initializeAuth` + `getReactNativePersistence`) instead of defaulting to
  in-memory-only persistence. This was the root cause of "my rated movies
  disappear after every hotfix": every JS reload silently logged the user
  out, and signing up again instead of logging back in landed on a
  brand-new empty account while the old one's ratings sat untouched in
  Firestore.
- Imported the auth persistence helpers from `@firebase/auth` directly
  rather than the `firebase/auth` wrapper, because the wrapper's published
  types don't resolve to its React Native build (a types-only gap in the
  package, not a runtime bug) - see the code comment in
  `src/services/firebase.ts` for details.

## Merged into main

### fix/movie-detail-existing-rating
- Movie detail screen now pre-fills a title's existing rating on load and
  shows "Update Rating" instead of "Add to My List" when one exists.

### fix/firestore-react-native-transport
- Fixed `FirebaseError: Failed to get document because the client is
  offline`, which was actually a transport problem: Firestore's default
  streaming transport isn't supported in RN's JS runtime. Forced long
  polling (`experimentalForceLongPolling`) and polyfilled the browser
  globals (`btoa`/`atob`/`DOMException`) that transport expects.
- Firestore write promises only resolve on full server acknowledgment, not
  on the local-cache commit that happens instantly - awaiting them for UI
  feedback caused "Add to List" to spin indefinitely even though the item
  had already been added. Switched writes (`addRanking`, `createUserProfile`,
  `followUser`, `unfollowUser`) to fire-and-forget with a `.catch()` for
  genuine failures.
- Added error callbacks to the `onSnapshot` subscriptions
  (`subscribeToRankings`, `subscribeToFollowing`) so a broken subscription
  is logged instead of just quietly leaving lists looking empty.

### feature/leaderboard
- Leaderboard tab ranked by number of titles logged, self + followed
  friends, pull-to-refresh.

### feature/friends
- Follow/unfollow friends by username search, and view a friend's ranked
  lists (read-only dashboard).

### feature/movie-cards-trailers
- Movie/show search and detail screen via TMDB, embedded trailer playback,
  rate-and-add-to-list flow.

### feature/dashboard-lists
- Dashboard showing the signed-in user's ranked titles, filterable by genre
  plus an all-time list.

### feature/auth
- Email/password sign up and log in (Firebase Auth), bottom-tab shell for
  the signed-in app.

### chore/app-scaffolding
- Initial scaffold: navigation, theme, Firebase/TMDB service stubs, project
  config (TypeScript, ESLint, Jest).
