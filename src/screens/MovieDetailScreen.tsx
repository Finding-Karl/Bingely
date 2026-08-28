import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { RouteProp, useRoute } from '@react-navigation/native';
import AppButton from '../components/AppButton';
import { useAuth } from '../context/AuthContext';
import { addRanking } from '../services/rankings';
import { getTitleDetails, posterUrl } from '../services/tmdb';
import { GENRES } from '../constants/genres';
import { MovieDetails } from '../types/models';
import { colors, fontSize, radius, spacing } from '../theme';
import type { MainStackParamList } from '../navigation/MainStack';

const SCORES = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

export default function MovieDetailScreen() {
  const { params } = useRoute<RouteProp<MainStackParamList, 'MovieDetail'>>();
  const { user } = useAuth();
  const [details, setDetails] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getTitleDetails(params.id, params.mediaType)
      .then(data => {
        if (!cancelled) setDetails(data);
      })
      .catch(e => {
        if (!cancelled) setError(e?.message ?? 'Could not load details.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [params.id, params.mediaType]);

  const handleSave = () => {
    if (!user || !details || selectedScore == null) return;
    setSaving(true);
    setSaveError(null);

    // Firestore resolves this promise only once the SERVER acknowledges the
    // write - but it applies the write to the local cache (and fires the
    // Dashboard's live listener) immediately, which is why the title shows
    // up on your list right away. Awaiting the full round trip here would
    // leave the button spinning on any flaky connection even though the
    // save already "happened" locally. A genuine failure (bad permissions,
    // invalid data) still surfaces below, just asynchronously.
    addRanking(user.uid, {
      movieId: details.id,
      mediaType: details.mediaType,
      title: details.title,
      posterPath: details.posterPath,
      genreIds: details.genreIds,
      score: selectedScore,
    }).catch((e: any) => {
      setSaved(false);
      setSaveError(e?.message ?? 'Could not save your rating. Try again.');
    });

    setSaved(true);
    setSaving(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.hint}>Loading…</Text>
      </View>
    );
  }
  if (error || !details) {
    return (
      <View style={styles.center}>
        <Text style={styles.hint}>{error ?? 'Not found.'}</Text>
      </View>
    );
  }

  const trailer = details.videos.find(v => v.type === 'Trailer') ?? details.videos[0];
  const genreNames = details.genreIds
    .map(id => GENRES.find(g => g.id === id)?.name)
    .filter((name): name is string => Boolean(name));
  const poster = posterUrl(details.posterPath);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        {poster ? (
          <Image source={{ uri: poster }} style={styles.poster} />
        ) : (
          <View style={[styles.poster, styles.posterFallback]} />
        )}
        <View style={styles.headerInfo}>
          <Text style={styles.title}>{details.title}</Text>
          {details.releaseYear ? <Text style={styles.year}>{details.releaseYear}</Text> : null}
          <View style={styles.genreRow}>
            {genreNames.map(name => (
              <View key={name} style={styles.genreChip}>
                <Text style={styles.genreChipText}>{name}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {trailer ? (
        <View style={styles.trailerWrap}>
          <WebView
            source={{ uri: `https://www.youtube.com/embed/${trailer.key}` }}
            style={styles.trailer}
            allowsFullscreenVideo
          />
        </View>
      ) : (
        <Text style={styles.hint}>No trailer or clip available for this title.</Text>
      )}

      {details.overview ? <Text style={styles.overview}>{details.overview}</Text> : null}

      <Text style={styles.sectionTitle}>Rate it</Text>
      <View style={styles.scoreRow}>
        {SCORES.map(score => (
          <AppButton
            key={score}
            title={String(score)}
            variant={selectedScore === score ? 'primary' : 'secondary'}
            onPress={() => setSelectedScore(score)}
            style={styles.scoreButton}
          />
        ))}
      </View>

      {saveError ? <Text style={styles.saveErrorText}>{saveError}</Text> : null}
      <AppButton
        title={saved ? 'Added to your list ✓' : 'Add to My List'}
        onPress={handleSave}
        loading={saving}
        disabled={selectedScore == null || saving}
        style={styles.saveButton}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  center: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  hint: { color: colors.textMuted, fontSize: fontSize.sm, textAlign: 'center' },
  header: { flexDirection: 'row', marginBottom: spacing.lg },
  poster: {
    width: 100,
    height: 148,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    marginRight: spacing.md,
  },
  posterFallback: { borderWidth: 1, borderColor: colors.border },
  headerInfo: { flex: 1, justifyContent: 'center' },
  title: { color: colors.text, fontSize: fontSize.lg, fontWeight: '800' },
  year: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: spacing.xs },
  genreRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm },
  genreChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  genreChipText: { color: colors.textMuted, fontSize: fontSize.xs },
  trailerWrap: {
    height: 200,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    marginBottom: spacing.lg,
  },
  trailer: { flex: 1 },
  overview: { color: colors.text, fontSize: fontSize.sm, lineHeight: 20, marginBottom: spacing.lg },
  sectionTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '700', marginBottom: spacing.sm },
  scoreRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.lg },
  scoreButton: { width: 52, marginRight: spacing.sm, marginBottom: spacing.sm, paddingVertical: spacing.sm },
  saveButton: {},
  saveErrorText: { color: colors.danger, fontSize: fontSize.sm, marginBottom: spacing.sm },
});
