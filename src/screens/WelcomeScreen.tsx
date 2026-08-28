import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { isFirebaseConfigured } from '../services/firebase';
import { isTmdbConfigured } from '../services/tmdb';
import { colors, spacing, fontSize } from '../theme';

/**
 * Temporary landing screen for the scaffolding branch - proves navigation,
 * theming, and the Firebase/TMDB service stubs are wired up correctly.
 * Replaced by the real Login/Signup flow in feature/auth.
 */
export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bingely</Text>
      <Text style={styles.subtitle}>Rank the movies and shows you watch.</Text>

      <View style={styles.statusBox}>
        <StatusLine label="Firebase config" ok={isFirebaseConfigured} />
        <StatusLine label="TMDB config" ok={isTmdbConfigured} />
      </View>
    </View>
  );
}

function StatusLine({ label, ok }: { label: string; ok: boolean }) {
  return (
    <Text style={styles.statusText}>
      {ok ? '✅' : '⏳'} {label} {ok ? 'connected' : '- add keys to .env'}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  statusBox: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.xs,
  },
  statusText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
});
