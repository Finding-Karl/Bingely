import React from 'react';
import { StatusBar } from 'react-native';
import { useAppTheme } from '../context/ThemeContext';

/** Keeps the status bar icons legible against whichever background is active -
 * dark icons on the light background (the default), light icons on dark. */
export default function ThemedStatusBar() {
  const { isDarkMode } = useAppTheme();
  return <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />;
}
