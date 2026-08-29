import type { IoniconsIconName } from '@react-native-vector-icons/ionicons/static';

/**
 * One glyph per GENRES entry (./genres.ts), keyed by TMDB genre id. Kept
 * separate from GENRES itself since the icon is purely a Search tab UI
 * concern (the genre category cards) - GenreTabs and the Dashboard/
 * FriendProfile genre filters only ever need id/name.
 */
export const GENRE_ICONS: Record<number, IoniconsIconName> = {
  28: 'flash-outline', // Action
  12: 'compass-outline', // Adventure
  16: 'color-palette-outline', // Animation
  35: 'happy-outline', // Comedy
  80: 'shield-outline', // Crime
  99: 'globe-outline', // Documentary
  18: 'book-outline', // Drama
  27: 'skull-outline', // Horror
  10749: 'heart-outline', // Romance
  10765: 'planet-outline', // Sci-Fi & Fantasy
  53: 'flashlight-outline', // Thriller
};

/** Fallback for any genre id not covered above (e.g. GENRES gains an entry before this map is updated). */
export const DEFAULT_GENRE_ICON: IoniconsIconName = 'film-outline';
