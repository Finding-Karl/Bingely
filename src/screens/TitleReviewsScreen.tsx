import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AppButton from '../components/AppButton';
import { useAuth } from '../context/AuthContext';
import { FriendReview, getFriendsRankingsForTitle, getRanking } from '../services/rankings';
import { posterUrl } from '../services/tmdb';
import { RankedItem } from '../types/models';
import { useAppTheme } from '../context/ThemeContext';
import { AppColors, fontSize, radius, spacing } from '../theme';
import type { MainStackParamList } from '../navigation/MainStack';

/**
 * Opened by tapping a title on the Dashboard: your own rating/review for
 * it, plus what your friends thought - both fetched fresh here rather than
 * carried over as nav params, so coming back from editing (via the "Edit"
 * button below, which reuses MovieDetailScreen rather than duplicating the
 * rating/review UI a second time) shows the current values, not whatever
 * was true at the moment you tapped the row.
 */
export default function TitleReviewsScreen() {
  const { params } = useRoute<RouteProp<MainStackParamList, 'TitleReviews'>>();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { user } = useAuth();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [yours, setYours] = useState<RankedItem | null>(null);
  const [friends, setFriends] = useState<FriendReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      let cancelled = false;
      setLoading(true);
      Promise.all([
        getRanking(user.uid, params.mediaType, params.movieId),
        getFriendsRankingsForTitle(params.mediaType, params.movieId),
      ])
        .then(([ownRanking, friendReviews]) => {
          if (cancelled) return;
          setYours(ownRanking);
          setFriends(friendReviews);
          setError(null);
        })
        .catch(fetchError => {
          console.error('TitleReviewsScreen load failed:', fetchError);
          if (!cancelled) setError('Could not load reviews. Try again in a moment.');
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [user, params.mediaType, params.movieId]),
  );

  const poster = posterUrl(params.posterPath);

  if (loading && !yours && friends.length === 0 && !error) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {poster ? (
          <Image source={{ uri: poster }} style={styles.poster} />
        ) : (
          <View style={[styles.poster, styles.posterFallback]} />
        )}
        <View style={styles.headerInfo}>
          <Text style={styles.title} numberOfLines={2}>
            {params.title}
          </Text>
          <Text style={styles.meta}>{params.mediaType === 'movie' ? 'Movie' : 'TV'}</Text>
        </View>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Text style={styles.sectionTitle}>Your rating</Text>
      {yours ? (
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreText}>{yours.score.toFixed(1)}</Text>
            </View>
            <AppButton
              title="Edit"
              variant="secondary"
              style={styles.editButton}
              onPress={() =>
                navigation.navigate('MovieDetail', { id: params.movieId, mediaType: params.mediaType })
              }
            />
          </View>
          {yours.review ? (
            <Text style={styles.reviewText}>{yours.review}</Text>
          ) : (
            <Text style={styles.noReviewText}>You haven't written a review for this yet.</Text>
          )}
        </View>
      ) : (
        <Text style={styles.hint}>You haven't rated this yet.</Text>
      )}

      <Text style={styles.sectionTitle}>Friends' ratings</Text>
      {friends.length === 0 ? (
        <Text style={styles.hint}>None of your friends have rated this yet.</Text>
      ) : (
        friends.map(friend => (
          <Pressable
            key={friend.uid}
            style={styles.card}
            onPress={() =>
              navigation.navigate('FriendProfile', { uid: friend.uid, username: friend.username })
            }
          >
            <View style={styles.cardTop}>
              <Text style={styles.friendName}>@{friend.username}</Text>
              <View style={styles.scoreBadge}>
                <Text style={styles.scoreText}>{friend.score.toFixed(1)}</Text>
              </View>
            </View>
            {friend.review ? (
              <Text style={styles.reviewText}>{friend.review}</Text>
            ) : (
              <Text style={styles.noReviewText}>No review written.</Text>
            )}
          </Pressable>
        ))
      )}
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
    center: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    header: { flexDirection: 'row', marginBottom: spacing.lg },
    poster: {
      width: 72,
      height: 106,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceAlt,
      marginRight: spacing.md,
    },
    posterFallback: { borderWidth: 1, borderColor: colors.border },
    headerInfo: { flex: 1, justifyContent: 'center' },
    title: { color: colors.text, fontSize: fontSize.lg, fontWeight: '800' },
    meta: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: spacing.xs },
    errorText: { color: colors.danger, fontSize: fontSize.sm, marginBottom: spacing.md },
    sectionTitle: {
      color: colors.text,
      fontSize: fontSize.md,
      fontWeight: '700',
      marginBottom: spacing.sm,
      marginTop: spacing.sm,
    },
    hint: { color: colors.textMuted, fontSize: fontSize.sm, marginBottom: spacing.lg },
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    cardTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.xs,
    },
    friendName: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
    scoreBadge: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      minWidth: 40,
      alignItems: 'center',
    },
    scoreText: { color: colors.text, fontWeight: '700', fontSize: fontSize.sm },
    editButton: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
    reviewText: { color: colors.text, fontSize: fontSize.sm, lineHeight: 20 },
    noReviewText: { color: colors.textMuted, fontSize: fontSize.sm, fontStyle: 'italic' },
  });
}
