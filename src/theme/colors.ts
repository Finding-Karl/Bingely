/**
 * Bingely color palettes. Light is the default; dark is an opt-in toggle
 * under Settings (see src/context/ThemeContext.tsx) rather than following
 * the system appearance. Both palettes share the same keys/roles so any
 * screen can switch between them without touching its styles.
 */
export const darkColors = {
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

export type AppColors = typeof darkColors;

export const lightColors: AppColors = {
  background: '#F7F8FA',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF0F4',
  border: '#DDE1E8',

  text: '#14161C',
  textMuted: '#6B7280',

  primary: '#E5484D',
  primaryMuted: '#F7D9DA',

  success: '#1E9E5A',
  warning: '#B5730A',
  danger: '#D93036',

  gold: '#A67C00',
  silver: '#6B7280',
  bronze: '#8B4513',
};
