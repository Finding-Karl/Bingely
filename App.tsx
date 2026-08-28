/**
 * Bingely
 * MVP scaffolding - real navigation/auth wiring lands in feature/auth.
 *
 * @format
 */

import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/context/ThemeContext';
import ThemedStatusBar from './src/components/ThemedStatusBar';
import RootNavigator from './src/navigation';

function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedStatusBar />
        <RootNavigator />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default App;
