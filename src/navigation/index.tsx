import React, { useEffect, useState } from 'react';
import { DefaultTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { enableScreens } from 'react-native-screens';
import SplashScreen from '../components/SplashScreen';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';
import AuthNavigator from './AuthNavigator';
import MainStack from './MainStack';

/** Minimum time the JS splash stays up, so a fast auth check (already
 * cached/local) doesn't flash the branded splash for a few milliseconds
 * and read as a glitch instead of an intentional launch moment. */
const MIN_SPLASH_DURATION_MS = 1000;

enableScreens();

function RootSwitch() {
  const { user, initializing } = useAuth();
  const [minDurationElapsed, setMinDurationElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinDurationElapsed(true), MIN_SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  if (initializing || !minDurationElapsed) {
    return <SplashScreen />;
  }

  return user ? <MainStack /> : <AuthNavigator />;
}

/** Builds react-navigation's own theme from the active app theme, so headers,
 * tab bars, and screen backgrounds it manages directly follow the same
 * light/dark choice as the rest of the app. */
function ThemedNavigationContainer({ children }: { children: React.ReactNode }) {
  const { colors, isDarkMode } = useAppTheme();
  const navigationTheme: Theme = {
    ...DefaultTheme,
    dark: isDarkMode,
    colors: {
      ...DefaultTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.primary,
    },
  };
  return <NavigationContainer theme={navigationTheme}>{children}</NavigationContainer>;
}

export default function RootNavigator() {
  return (
    <AuthProvider>
      <ThemedNavigationContainer>
        <RootSwitch />
      </ThemedNavigationContainer>
    </AuthProvider>
  );
}

