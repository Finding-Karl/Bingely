import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getFollowing } from '../services/social';
import { getRankingsCount } from '../services/rankings';
import { getUserProfile } from '../services/userProfile';
import { useAppTheme } from '../context/ThemeContext';
import { AppColors, fontSize, radius, spacing } from '../theme';

interface LeaderboardEntry {
  uid: string;
  username: string;
  count: number;
  isSelf: boolean;
}

export default function LeaderboardScreen() {
  const { user } = useAuth();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const rankColors: Record<number, string> = { 1: colors.gold, 2: colors.silver, 3: colors.bronze };
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setError(null);
    } catch (loadError) {
      // One-shot getDoc/getDocs reads can spuriously reject with
      // "client is offline" while Firestore's long-poll connection is still
      // warming up (right after a reload, for example) - surface it instead
      // of leaving an unhandled rejection and a frozen spinner.
      console.error('LeaderboardScreen load failed:', loadError);
      setError('Could not load the leaderboard. Pull down to try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load().catch(loadError => {
      console.error('LeaderboardScreen initial load failed:', loadError);
    });
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
              <Text style={[styles.rank, { color: rankColors[rank] ?? colors.textMuted }]}>
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
            <Text style={styles.hint}>
              {error ?? 'Follow some friends to see a leaderboard.'}
            </Text>
          ) : undefined
        }
      />
    </View>
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
    username: {
      flex: 1,
      color: colors.text,
      fontSize: fontSize.md,
      fontWeight: '600',
      marginLeft: spacing.sm,
    },
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
}
