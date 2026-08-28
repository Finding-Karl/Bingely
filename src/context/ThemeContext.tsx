import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppColors, darkColors, lightColors } from '../theme';

const DARK_MODE_STORAGE_KEY = '@bingely/dark-mode';

interface ThemeContextValue {
  colors: AppColors;
  isDarkMode: boolean;
  setDarkMode: (value: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Light by default - dark mode is an opt-in toggle in Settings, not tied
  // to the device's system appearance.
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(DARK_MODE_STORAGE_KEY)
      .then(stored => {
        if (stored != null) setIsDarkMode(stored === 'true');
      })
      .catch(error => {
        console.error('Failed to load dark mode preference:', error);
      });
  }, []);

  const setDarkMode = (value: boolean) => {
    setIsDarkMode(value);
    AsyncStorage.setItem(DARK_MODE_STORAGE_KEY, String(value)).catch(error => {
      console.error('Failed to save dark mode preference:', error);
    });
  };

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: isDarkMode ? darkColors : lightColors,
      isDarkMode,
      setDarkMode,
    }),
    [isDarkMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return ctx;
}
