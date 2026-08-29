import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { ALL_TIME_LIST_ID, GENRES } from '../constants/genres';
import { useAppTheme } from '../context/ThemeContext';
import { AppColors, fontSize, radius, spacing } from '../theme';

interface Props {
  selected: string | number;
  onSelect: (value: string | number) => void;
}

export default function GenreTabs({ selected, onSelect }: Props) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Chip
        label="All Time"
        active={selected === ALL_TIME_LIST_ID}
        onPress={() => onSelect(ALL_TIME_LIST_ID)}
        styles={styles}
      />
      {GENRES.map(genre => (
        <Chip
          key={genre.id}
          label={genre.name}
          active={selected === genre.id}
          onPress={() => onSelect(genre.id)}
          styles={styles}
        />
      ))}
    </ScrollView>
  );
}

function Chip({
  label,
  active,
  onPress,
  styles,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    container: { flexGrow: 0, marginBottom: spacing.md },
    content: { paddingHorizontal: spacing.lg },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: spacing.sm,
    },
    chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipText: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600' },
    chipTextActive: { color: colors.background },
  });
}
