import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { RankedItem } from '../types/models';
import { posterUrl } from '../services/tmdb';
import { useAppTheme } from '../context/ThemeContext';
import { AppColors, fontSize, radius, spacing } from '../theme';

interface Props {
  item: RankedItem;
  rank: number;
  // Optional - the Dashboard passes this to open TitleReviewsScreen (see
  // your review plus what your friends thought); FriendProfileScreen's
  // read-only list leaves it unset, and the row renders identically either
  // way other than not being tappable.
  onPress?: () => void;
}

export default function RankingRow({ item, rank, onPress }: Props) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const rankColors: Record<number, string> = { 1: colors.gold, 2: colors.silver, 3: colors.bronze };
  const rankColor = rankColors[rank] ?? colors.textMuted;
  const uri = posterUrl(item.posterPath);

  const content = (
    <View style={styles.row}>
      <Text style={[styles.rank, { color: rankColor }]}>{rank}</Text>
      {uri ? (
        <Image source={{ uri }} style={styles.poster} />
      ) : (
        <View style={[styles.poster, styles.posterFallback]} />
      )}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.meta}>{item.mediaType === 'movie' ? 'Movie' : 'TV'}</Text>
        {item.review ? (
          <Text style={styles.review} numberOfLines={2}>
            {item.review}
          </Text>
        ) : null}
      </View>
      <View style={styles.scoreBadge}>
        <Text style={styles.scoreText}>{item.score.toFixed(1)}</Text>
      </View>
    </View>
  );

  if (!onPress) return content;
  return <Pressable onPress={onPress}>{content}</Pressable>;
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
    },
    rank: { width: 28, fontSize: fontSize.md, fontWeight: '800', textAlign: 'center' },
    poster: {
      width: 44,
      height: 64,
      borderRadius: radius.sm,
      backgroundColor: colors.surfaceAlt,
      marginRight: spacing.md,
    },
    posterFallback: { borderWidth: 1, borderColor: colors.border },
    info: { flex: 1, marginRight: spacing.sm },
    title: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
    meta: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
    review: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2, fontStyle: 'italic' },
    scoreBadge: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      minWidth: 40,
      alignItems: 'center',
    },
    scoreText: { color: colors.text, fontWeight: '700', fontSize: fontSize.sm },
  });
}
