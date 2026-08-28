/**
 * Bingely color palette. Dark-first, similar in spirit to Beli's ranking app:
 * high-contrast score badges (gold/silver/bronze) against a dark surface.
 */
export const colors = {
  background: '#0B0D12',
  surface: '#151822',
  surfaceAlt: '#1E2230',
  border: '#2A2E3B',

  text: '#F5F6FA',
  textMuted: '#9098A8',

  primary: '#FF5A5F',
  primaryMuted: '#7A2E30',

  success: '#3DDC84',
  warning: '#F5A623',
  danger: '#E5484D',

  gold: '#D4AF37',
  silver: '#C0C0C0',
  bronze: '#CD7F32',
};

export type AppColors = typeof colors;
