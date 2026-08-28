import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { subscribeToRankings } from '../services/rankings';
import { RankedItem } from '../types/models';
import { ALL_TIME_LIST_ID } from '../constants/genres';
import GenreTabs from '../components/GenreTabs';
import RankingRow from '../components/RankingRow';
import { colors, fontSize, spacing } from '../theme';
import type { MainStackParamList } from '../navigation/MainStack';

/** Read-only version of the Dashboard, for viewing a friend's ranked lists. */
export default function FriendProfileScreen() {
  const { params } = useRoute<RouteProp<MainStackParamList, 'FriendProfile'>>();
  const [rankings, setRankings] = useState<RankedItem[]>([]);
  const [selectedList, setSelectedList] = useState<string | number>(ALL_TIME_LIST_ID);

  useEffect(() => subscribeToRankings(params.uid, setRankings), [params.uid]);

  const visibleRankings = useMemo(() => {
    if (selectedList === ALL_TIME_LIST_ID) return rankings;
    return rankings.filter(item => item.genreIds.includes(selectedList as number));
  }, [rankings, selectedList]);

  return (
    <View style={styles.container}>
      <GenreTabs selected={selectedList} onSelect={setSelectedList} />
      {visibleRankings.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>@{params.username} hasn't ranked anything here yet.</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: spacing.lg },
  empty: { alignItems: 'center', marginTop: spacing.xxl, paddingHorizontal: spacing.lg },
  emptyText: { color: colors.textMuted, fontSize: fontSize.sm, textAlign: 'center' },
});
