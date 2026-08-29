import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../context/ThemeContext';
import { AppColors, fontSize, spacing } from '../theme';

/** Shared "not built yet" screen - each tab swaps this for real content in its own branch. */
export default function PlaceholderScreen({ title, note }: { title: string; note?: string }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.note}>{note ?? 'Coming soon.'}</Text>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    title: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
    note: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: spacing.xs },
  });
}
