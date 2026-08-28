import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { DefaultTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { enableScreens } from 'react-native-screens';
import { AuthProvider, useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import MainTabs from './MainTabs';
import { colors } from '../theme';

enableScreens();

const navigationTheme: Theme = {
  ...DefaultTheme,
  dark: true,
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

function RootSwitch() {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return user ? <MainTabs /> : <AuthNavigator />;
}

export default function RootNavigator() {
  return (
    <AuthProvider>
      <NavigationContainer theme={navigationTheme}>
        <RootSwitch />
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
