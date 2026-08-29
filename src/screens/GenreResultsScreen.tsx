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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    discoverByGenre(route.params.genreId)
      .then(data => {
        if (!cancelled) setResults(data);
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
          renderItem={({ item }) => (
            <MovieCard
              movie={item}
              onPress={() =>
                navigation.navigate('MovieDetail', { id: item.id, mediaType: item.mediaType })
              }
            />
          )}
          ListEmptyComponent={<Text style={styles.hint}>No titles found for this genre.</Text>}
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
    hint: {
      color: colors.textMuted,
      fontSize: fontSize.sm,
      textAlign: 'center',
      marginTop: spacing.xl,
      paddingHorizontal: spacing.lg,
    },
  });
}
