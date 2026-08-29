import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { MovieSummary } from '../types/models';
import { posterUrl } from '../services/tmdb';
import { useAppTheme } from '../context/ThemeContext';
import { AppColors, fontSize, radius, spacing } from '../theme';

export default function MovieCard({
  movie,
  onPress,
}: {
  movie: MovieSummary;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const uri = posterUrl(movie.posterPath);
  return (
    <Pressable onPress={onPress} style={styles.card}>
      {uri ? (
        <Image source={{ uri }} style={styles.poster} />
      ) : (
        <View style={[styles.poster, styles.posterFallback]} />
      )}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {movie.title}
        </Text>
        <View style={styles.metaRow}>
          {movie.releaseYear ? <Text style={styles.meta}>{movie.releaseYear}</Text> : null}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{movie.mediaType === 'movie' ? 'Movie' : 'TV'}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.md,
    },
    poster: {
      width: 56,
      height: 80,
      borderRadius: radius.sm,
      backgroundColor: colors.surfaceAlt,
      marginRight: spacing.md,
    },
    posterFallback: { borderWidth: 1, borderColor: colors.border },
    info: { flex: 1, justifyContent: 'center' },
    title: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
    metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
    meta: { color: colors.textMuted, fontSize: fontSize.sm, marginRight: spacing.sm },
    badge: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
    },
    badgeText: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '600' },
  });
}
