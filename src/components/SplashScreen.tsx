import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

/**
 * JS-side splash shown while auth is initializing (see
 * src/navigation/index.tsx's RootSwitch), styled to match the native
 * launch screens (LaunchScreen.storyboard on iOS, launch_screen.xml on
 * Android) so there's no visual jump at the native-to-JS handoff.
 *
 * Colors are hardcoded rather than pulled from useAppTheme(): dark mode
 * here is an in-app AsyncStorage setting, not the OS appearance, so it
 * isn't known yet at this point in app startup - the native splash screens
 * this matches are hardcoded to the same light-mode red for the same
 * reason (see theme/colors.ts's light `primary`, #E5484D).
 */
export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.wordmark}>Bingely</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5484D',
  },
  wordmark: {
    color: '#FFFFFF',
    fontFamily: 'PlayfairDisplay-SemiBoldItalic',
    fontSize: 40,
  },
});
