import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

// Same file baked into the native launch screens
// (ios/bingely/Images.xcassets/wordmark.imageset, android's splash_glyph is
// the icon's "b" instead - see launch_screen.xml). Rendering this exact PNG
// here too, at the same width the iOS storyboard uses it at, guarantees the
// JS splash is pixel-for-pixel the same size as the native one it replaces -
// a live <Text> in a matching font/size still isn't exactly the same glyph
// metrics as the baked image, which is what caused the size mismatch.
const WORDMARK = require('../assets/images/wordmark.png');

// Source image is 835x277 (see LaunchScreen.storyboard's imageView, which
// uses the same 220pt width and ratio).
const WORDMARK_WIDTH = 220;
const WORDMARK_ASPECT_RATIO = 835 / 277;

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
      <Image source={WORDMARK} style={styles.wordmark} resizeMode="contain" />
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
    width: WORDMARK_WIDTH,
    height: WORDMARK_WIDTH / WORDMARK_ASPECT_RATIO,
  },
});
