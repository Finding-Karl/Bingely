import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AppTextInput from '../components/AppTextInput';
import MovieCard from '../components/MovieCard';
import { isTmdbConfigured, searchTitles } from '../services/tmdb';
import { MovieSummary } from '../types/models';
import { useAppTheme } from '../context/ThemeContext';
import { AppColors, fontSize, spacing } from '../theme';
import type { MainStackParamList } from '../navigation/MainStack';

export default function SearchScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MovieSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setError(null);
      return;
    }
    let cancelled = false;
    const timeout = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await searchTitles(query);
        if (!cancelled) setResults(data);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Search failed.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query]);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Search</Text>
      <View style={styles.searchBox}>
        <AppTextInput
          placeholder="Search movies & shows"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
        />
      </View>

      {!isTmdbConfigured ? (
        <Text style={styles.hint}>Add a TMDB key to .env to enable search (see .env.example).</Text>
      ) : loading ? (
        <ActivityIndicator color={colors.primary} style={styles.spinner} />
      ) : error ? (
        <Text style={styles.hint}>{error}</Text>
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => `${item.mediaType}-${item.id}`}
          renderItem={({ item }) => (
            <MovieCard
              movie={item}
              onPress={() =>
                navigation.navigate('MovieDetail', { id: item.id, mediaType: item.mediaType })
              }
            />
          )}
          ListEmptyComponent={
            query.trim() ? <Text style={styles.hint}>No results.</Text> : undefined
          }
        />
      )}
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
      marginBottom: spacing.md,
    },
    searchBox: { paddingHorizontal: spacing.lg },
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
