import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AppButton from '../components/AppButton';
import AppTextInput from '../components/AppTextInput';
import { useAuth } from '../context/AuthContext';
import {
  FollowingEntry,
  followUser,
  searchUsers,
  subscribeToFollowing,
  unfollowUser,
} from '../services/social';
import { UserProfile } from '../types/models';
import { colors, fontSize, spacing } from '../theme';
import type { MainStackParamList } from '../navigation/MainStack';

export default function FriendsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [following, setFollowing] = useState<FollowingEntry[]>([]);

  useEffect(() => {
    if (!user) return;
    return subscribeToFollowing(user.uid, setFollowing);
  }, [user]);

  useEffect(() => {
    if (!user || !query.trim()) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await searchUsers(query, user.uid);
        if (!cancelled) setResults(data);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query, user]);

  const followingUids = new Set(following.map(entry => entry.uid));

  const handleToggleFollow = (target: UserProfile) => {
    if (!user) return;
    // Fire-and-forget, same reasoning as MovieDetailScreen's save flow -
    // don't block on Firestore's write-acknowledgment round trip.
    const action = followingUids.has(target.uid)
      ? unfollowUser(user.uid, target.uid)
      : followUser(user.uid, target);
    action.catch(error => {
      console.error('handleToggleFollow failed:', error);
    });
  };

  const showingSearch = query.trim().length > 0;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Friends</Text>
      <View style={styles.searchBox}>
        <AppTextInput
          placeholder="Search by username"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
        />
      </View>

      {showingSearch ? (
        searching ? (
          <ActivityIndicator color={colors.primary} style={styles.spinner} />
        ) : (
          <FlatList
            data={results}
            keyExtractor={item => item.uid}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <Pressable
                  style={styles.rowInfo}
                  onPress={() =>
                    navigation.navigate('FriendProfile', { uid: item.uid, username: item.username })
                  }
                >
                  <Text style={styles.username}>@{item.username}</Text>
                </Pressable>
                <AppButton
                  title={followingUids.has(item.uid) ? 'Following' : 'Follow'}
                  variant={followingUids.has(item.uid) ? 'secondary' : 'primary'}
                  onPress={() => handleToggleFollow(item)}
                  style={styles.followButton}
                />
              </View>
            )}
            ListEmptyComponent={<Text style={styles.hint}>No users found.</Text>}
          />
        )
      ) : (
        <FlatList
          data={following}
          keyExtractor={item => item.uid}
          ListHeaderComponent={<Text style={styles.sectionTitle}>Following</Text>}
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() =>
                navigation.navigate('FriendProfile', { uid: item.uid, username: item.username })
              }
            >
              <Text style={styles.username}>@{item.username}</Text>
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={styles.hint}>You aren&apos;t following anyone yet - search above.</Text>
          }
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
  searchBox: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  spinner: { marginTop: spacing.xl },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  rowInfo: { flex: 1 },
  username: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  followButton: { width: 104, paddingVertical: spacing.xs + 2 },
  hint: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
});
