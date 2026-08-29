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
