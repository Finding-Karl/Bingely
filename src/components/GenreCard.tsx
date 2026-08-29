import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons, type IoniconsIconName } from '@react-native-vector-icons/ionicons/static';
import { useAppTheme } from '../context/ThemeContext';
import { AppColors, fontSize, radius, spacing } from '../theme';

/**
 * A single genre tile for the Search tab's landing grid. Deliberately
 * plain - a bordered surface, one outline glyph, one line of text, a subtle
 * press state - rather than illustration/color-block genre art, in the
 * same restrained spirit as Atlassian's card components (atlassian.design/
 * components): content and hierarchy carry the design, not decoration.
 */
export default function GenreCard({
  name,
  icon,
  onPress,
}: {
  name: string;
  icon: IoniconsIconName;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <Ionicons name={icon} size={24} color={colors.primary} />
      <Text style={styles.label} numberOfLines={1}>
        {name}
      </Text>
    </Pressable>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    card: {
      flex: 1,
      minHeight: 96,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardPressed: { opacity: 0.6 },
    label: {
      color: colors.text,
      fontSize: fontSize.sm,
      fontWeight: '600',
      marginTop: spacing.sm,
      textAlign: 'center',
    },
  });
}
