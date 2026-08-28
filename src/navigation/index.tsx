import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { DefaultTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { enableScreens } from 'react-native-screens';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';
import AuthNavigator from './AuthNavigator';
import MainStack from './MainStack';

enableScreens();

function RootSwitch() {
  const { user, initializing } = useAuth();
  const { colors } = useAppTheme();

  if (initializing) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
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

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
