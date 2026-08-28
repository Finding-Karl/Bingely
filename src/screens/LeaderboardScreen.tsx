import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getFollowing } from '../services/social';
import { getRankingsCount } from '../services/rankings';
import { getUserProfile } from '../services/userProfile';
import { colors, fontSize, radius, spacing } from '../theme';

interface LeaderboardEntry {
  uid: string;
  username: string;
  count: number;
  isSelf: boolean;
}

const RANK_COLORS: Record<number, string> = { 1: colors.gold, 2: colors.silver, 3: colors.bronze };

export default function LeaderboardScreen() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [selfProfile, selfCount, following] = await Promise.all([
        getUserProfile(user.uid),
        getRankingsCount(user.uid),
        getFollowing(user.uid),
      ]);

      const friendEntries = await Promise.all(
        following.map(async friend => ({
          uid: friend.uid,
          username: friend.username,
          count: await getRankingsCount(friend.uid),
          isSelf: false,
        })),
      );

      const selfEntry: LeaderboardEntry = {
        uid: user.uid,
        username: selfProfile?.username ?? 'you',
        count: selfCount,
        isSelf: true,
      };

      setEntries([selfEntry, ...friendEntries].sort((a, b) => b.count - a.count));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Leaderboard</Text>
      <Text style={styles.subheading}>Ranked by titles logged</Text>
      <FlatList
        data={entries}
        keyExtractor={item => item.uid}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />
        }
        renderItem={({ item, index }) => {
          const rank = index + 1;
          return (
            <View style={styles.row}>
              <Text style={[styles.rank, { color: RANK_COLORS[rank] ?? colors.textMuted }]}>
                {rank}
              </Text>
              <Text style={[styles.username, item.isSelf && styles.usernameSelf]}>
                @{item.username}
                {item.isSelf ? ' (you)' : ''}
              </Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{item.count}</Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.hint}>Follow some friends to see a leaderboard.</Text>
          ) : undefined
        }
      />
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
  },
  subheading: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
  },
  rank: { width: 28, fontSize: fontSize.md, fontWeight: '800', textAlign: 'center' },
  username: { flex: 1, color: colors.text, fontSize: fontSize.md, fontWeight: '600', marginLeft: spacing.sm },
  usernameSelf: { color: colors.primary },
  countBadge: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minWidth: 40,
    alignItems: 'center',
  },
  countText: { color: colors.text, fontWeight: '700', fontSize: fontSize.sm },
  hint: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
});
