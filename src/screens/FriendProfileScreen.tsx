import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useFocusEffect, useRoute } from '@react-navigation/native';
import { getRankings } from '../services/rankings';
import { RankedItem } from '../types/models';
import { ALL_TIME_LIST_ID } from '../constants/genres';
import GenreTabs from '../components/GenreTabs';
import RankingRow from '../components/RankingRow';
import { useAppTheme } from '../context/ThemeContext';
import { AppColors, fontSize, spacing } from '../theme';
import type { MainStackParamList } from '../navigation/MainStack';

/** Read-only version of the Dashboard, for viewing a friend's ranked lists. */
export default function FriendProfileScreen() {
  const { params } = useRoute<RouteProp<MainStackParamList, 'FriendProfile'>>();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [rankings, setRankings] = useState<RankedItem[]>([]);
  // Firestore's live listener had no meaningful "loading" state (it just
  // fires once cached/synced data is available) - a one-shot fetch needs a
  // real one, since there's no cache to show while the request is in flight.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedList, setSelectedList] = useState<string | number>(ALL_TIME_LIST_ID);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      getRankings(params.uid)
        .then(items => {
          if (cancelled) return;
          setRankings(items);
          setError(null);
        })
        .catch(fetchError => {
          console.error('getRankings failed:', fetchError);
          if (!cancelled) setError('Could not load this list. Try again in a moment.');
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [params.uid]),
  );

  const visibleRankings = useMemo(() => {
    if (selectedList === ALL_TIME_LIST_ID) return rankings;
    return rankings.filter(item => item.genreIds.includes(selectedList as number));
  }, [rankings, selectedList]);

  if (loading && rankings.length === 0 && !error) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GenreTabs selected={selectedList} onSelect={setSelectedList} />
      {visibleRankings.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            {error ?? `@${params.username} hasn't ranked anything here yet.`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={visibleRankings}
          keyExtractor={item => item.id}
          renderItem={({ item, index }) => <RankingRow item={item} rank={index + 1} />}
        />
      )}
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, paddingTop: spacing.lg },
    center: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    empty: { alignItems: 'center', marginTop: spacing.xxl, paddingHorizontal: spacing.lg },
    emptyText: { color: colors.textMuted, fontSize: fontSize.sm, textAlign: 'center' },
  });
}
