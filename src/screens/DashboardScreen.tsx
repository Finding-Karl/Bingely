import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { deleteRanking, getRankings } from '../services/rankings';
import { RankedItem } from '../types/models';
import { ALL_TIME_LIST_ID } from '../constants/genres';
import GenreTabs from '../components/GenreTabs';
import RankingRow from '../components/RankingRow';
import SwipeToDelete from '../components/SwipeToDelete';
import { useAppTheme } from '../context/ThemeContext';
import { AppColors, fontSize, spacing } from '../theme';

export default function DashboardScreen() {
  const { user } = useAuth();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [rankings, setRankings] = useState<RankedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedList, setSelectedList] = useState<string | number>(ALL_TIME_LIST_ID);

  const load = useCallback(async () => {
    if (!user) {
      setRankings([]);
      return;
    }
    setLoading(true);
    try {
      setRankings(await getRankings(user.uid));
    } catch (error) {
      // A plain fetch can fail transiently (flaky connection, a cold Cloud
      // Function instance) - log it and leave the last-known list showing
      // rather than clearing it out from under the user.
      console.error('getRankings failed:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Refetch every time this tab regains focus. Rankings are added from
  // MovieDetailScreen, pushed on top of this tab - "focus" is the signal
  // that used to come from Firestore's live listener, which a plain HTTP
  // API has no equivalent of.
  useFocusEffect(
    useCallback(() => {
      load().catch(error => {
        console.error('DashboardScreen focus load failed:', error);
      });
    }, [load]),
  );

  const visibleRankings = useMemo(() => {
    if (selectedList === ALL_TIME_LIST_ID) return rankings;
    return rankings.filter(item => item.genreIds.includes(selectedList as number));
  }, [rankings, selectedList]);

  const handleDelete = (item: RankedItem) => {
    if (!user) return;
    // Optimistic: remove locally right away, roll back if the request
    // actually fails. Re-adding on failure doesn't try to reconstruct the
    // exact prior sort position - the next focus refetch settles that.
    setRankings(current => current.filter(r => r.id !== item.id));
    deleteRanking(user.uid, item.mediaType, item.movieId).catch(error => {
      console.error('deleteRanking failed:', error);
      setRankings(current => [...current, item]);
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.heading}>Your Lists</Text>
      <GenreTabs selected={selectedList} onSelect={setSelectedList} />
      <FlatList
        data={visibleRankings}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => (
          <SwipeToDelete onDelete={() => handleDelete(item)}>
            <RankingRow item={item} rank={index + 1} />
          </SwipeToDelete>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Nothing ranked here yet</Text>
            <Text style={styles.emptySubtitle}>
              Search for a movie or show and add it to your list.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, paddingTop: spacing.lg },
    heading: {
      color: colors.text,
      fontSize: fontSize.xl,
      fontWeight: '800',
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.md,
    },
    listContent: { flexGrow: 1, paddingBottom: spacing.xl },
    empty: { alignItems: 'center', marginTop: spacing.xxl, paddingHorizontal: spacing.lg },
    emptyTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
    emptySubtitle: {
      color: colors.textMuted,
      fontSize: fontSize.sm,
      marginTop: spacing.xs,
      textAlign: 'center',
    },
  });
}
