import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MovieCard from '../components/MovieCard';
import { discoverByGenre } from '../services/tmdb';
import { MovieSummary } from '../types/models';
import { useAppTheme } from '../context/ThemeContext';
import { AppColors, fontSize, spacing } from '../theme';
import type { MainStackParamList } from '../navigation/MainStack';

export default function GenreResultsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const route = useRoute<RouteProp<MainStackParamList, 'GenreResults'>>();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [results, setResults] = useState<MovieSummary[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setResults([]);
    setPage(1);
    setHasMore(false);
    discoverByGenre(route.params.genreId, 1)
      .then(data => {
        if (cancelled) return;
        setResults(data.results);
        setHasMore(data.hasMore);
      })
      .catch((e: any) => {
        if (!cancelled) setError(e?.message ?? 'Failed to load titles.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [route.params.genreId]);

  const loadMore = () => {
    if (loading || loadingMore || !hasMore) return;
    const nextPage = page + 1;
    setLoadingMore(true);
    discoverByGenre(route.params.genreId, nextPage)
      .then(data => {
        setResults(prev => [...prev, ...data.results]);
        setHasMore(data.hasMore);
        setPage(nextPage);
      })
      .catch(() => {
        // Leave whatever's already loaded on screen - a failed "load more"
        // shouldn't blow away results the user can already see.
        setHasMore(false);
      })
      .finally(() => setLoadingMore(false));
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.spinner} />
      ) : error ? (
        <Text style={styles.hint}>{error}</Text>
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => `${item.mediaType}-${item.id}`}
          contentContainerStyle={styles.listContent}
          onEndReachedThreshold={0.5}
          onEndReached={loadMore}
          renderItem={({ item }) => (
            <MovieCard
              movie={item}
              onPress={() =>
                navigation.navigate('MovieDetail', { id: item.id, mediaType: item.mediaType })
              }
            />
          )}
          ListEmptyComponent={<Text style={styles.hint}>No titles found for this genre.</Text>}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={colors.primary} style={styles.footerSpinner} />
            ) : undefined
          }
        />
      )}
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    listContent: { paddingTop: spacing.lg, paddingBottom: spacing.lg },
    spinner: { marginTop: spacing.xl },
    footerSpinner: { marginVertical: spacing.lg },
    hint: {
      color: colors.textMuted,
      fontSize: fontSize.sm,
      textAlign: 'center',
      marginTop: spacing.xl,
      paddingHorizontal: spacing.lg,
    },
  });
}
