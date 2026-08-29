/**
 * TMDB uses two different genre taxonomies for movies vs. TV shows - most
 * ids line up, but several don't: "Action" (28), "Adventure" (12),
 * "Horror" (27), "Romance" (10749) and "Thriller" (53) are movie-only ids
 * with no TV equivalent, while "Sci-Fi & Fantasy" (10765) is TV-only (movies
 * split that into Science Fiction 878 and Fantasy 14). GENRES (./genres.ts)
 * uses one id per category for icon lookup and, on a title's own record,
 * `genreIds.includes(id)` matching (which naturally uses whichever
 * taxonomy that title's own media type has - no bug there).
 *
 * This map exists ONLY for the /discover query built by discoverByGenre()
 * in src/services/tmdb.ts, which has to ask two different taxonomies for
 * what's presented as a single category card. `null` means "no clean
 * equivalent exists in that taxonomy" - that side is skipped rather than
 * sent a ​bogus id (which TMDB just silently returns zero results for,
 * which is what was causing entire categories to be missing half their
 * titles, or in Sci-Fi & Fantasy's case, missing every movie).
 */
export const GENRE_DISCOVER_IDS: Record<number, { movie: string | null; tv: string | null }> = {
  28: { movie: '28', tv: '10759' }, // Action -> Action & Adventure (TV)
  12: { movie: '12', tv: null }, // Adventure (TV folds this into Action & Adventure, already used by the Action card - not duplicated here)
  16: { movie: '16', tv: '16' }, // Animation
  35: { movie: '35', tv: '35' }, // Comedy
  80: { movie: '80', tv: '80' }, // Crime
  99: { movie: '99', tv: '99' }, // Documentary
  18: { movie: '18', tv: '18' }, // Drama
  27: { movie: '27', tv: null }, // Horror (no TV equivalent)
  10749: { movie: '10749', tv: null }, // Romance (no TV equivalent)
  10765: { movie: '878|14', tv: '10765' }, // Sci-Fi & Fantasy -> Science Fiction OR Fantasy (movie)
  53: { movie: '53', tv: null }, // Thriller (no TV equivalent)
};
