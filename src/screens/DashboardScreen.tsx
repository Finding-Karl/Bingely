import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { subscribeToRankings } from '../services/rankings';
import { RankedItem } from '../types/models';
import { ALL_TIME_LIST_ID } from '../constants/genres';
import GenreTabs from '../components/GenreTabs';
import RankingRow from '../components/RankingRow';
import { colors, fontSize, spacing } from '../theme';

export default function DashboardScreen() {
  const { user } = useAuth();
  const [rankings, setRankings] = useState<RankedItem[]>([]);
  const [selectedList, setSelectedList] = useState<string | number>(ALL_TIME_LIST_ID);

  useEffect(() => {
    if (!user) {
      setRankings([]);
      return;
    }
    return subscribeToRankings(user.uid, setRankings);
  }, [user]);

  const visibleRankings = useMemo(() => {
    if (selectedList === ALL_TIME_LIST_ID) return rankings;
    return rankings.filter(item => item.genreIds.includes(selectedList as number));
  }, [rankings, selectedList]);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Your Lists</Text>
      <GenreTabs selected={selectedList} onSelect={setSelectedList} />

      {visibleRankings.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Nothing ranked here yet</Text>
          <Text style={styles.emptySubtitle}>
            Search for a movie or show and add it to your list.
          </Text>
        </View>
      ) : (
        <FlatList
          data={visibleRankings}
          keyExtractor={item => item.id}
          renderItem={({ item, index }) => <RankingRow item={item} rank={index + 1} />}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: spacing.lg },
  heading: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '800',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  listContent: { paddingBottom: spacing.xl },
  empty: { alignItems: 'center', marginTop: spacing.xxl, paddingHorizontal: spacing.lg },
  emptyTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
