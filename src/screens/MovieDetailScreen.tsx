import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useHeaderHeight } from '@react-navigation/elements';
import AppButton from '../components/AppButton';
import AppTextInput from '../components/AppTextInput';
import RatingSlider from '../components/RatingSlider';
import { useAuth } from '../context/AuthContext';
import { addRanking, getRanking } from '../services/rankings';
import { getTitleDetails, posterUrl } from '../services/tmdb';
import { GENRES } from '../constants/genres';
import { MovieDetails } from '../types/models';
import { useAppTheme } from '../context/ThemeContext';
import { AppColors, fontSize, radius, spacing } from '../theme';
import type { MainStackParamList } from '../navigation/MainStack';

// The slider always has *a* position - there's no "nothing selected" state
// like the old button row had - so a new rating starts here and the user
// drags from it, rather than the Save button being disabled until a tap.
const DEFAULT_SCORE = 5.5;
const MAX_REVIEW_LENGTH = 2000;

export default function MovieDetailScreen() {
  const { params } = useRoute<RouteProp<MainStackParamList, 'MovieDetail'>>();
  const headerHeight = useHeaderHeight();
  const { user } = useAuth();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [details, setDetails] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedScore, setSelectedScore] = useState<number>(DEFAULT_SCORE);
  const [existingScore, setExistingScore] = useState<number | null>(null);
  const [reviewText, setReviewText] = useState('');
  const [saving, setSaving] = useState(false);
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

  // Pre-fill the score picker and switch the button to "Update Rating" if
  // this title is already on the user's list.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getRanking(user.uid, params.mediaType, params.id)
      .then(existing => {
        if (cancelled || !existing) return;
        setExistingScore(existing.score);
        setSelectedScore(existing.score);
        setReviewText(existing.review ?? '');
      })
      .catch(rankingError => {
        console.error('getRanking failed:', rankingError);
      });
    return () => {
      cancelled = true;
    };
  }, [user, params.id, params.mediaType]);

  const handleSave = async () => {
    if (!user || !details) return;
    setSaving(true);
    setSaveError(null);

    const scoreToSave = selectedScore;
    const reviewToSave = reviewText.trim() || null;
    try {
      // Unlike Firestore (which applied writes to a local cache immediately,
      // independent of the network, so the fire-and-forget version of this
      // used to feel instant), this is a plain HTTP call to the Cloud
      // Function with no local cache - awaiting it before updating the UI
      // avoids a race where navigating back to the Dashboard could trigger
      // its focus refetch (see DashboardScreen.tsx) before this write has
      // actually landed, which would show a stale list.
      await addRanking(user.uid, {
        movieId: details.id,
        mediaType: details.mediaType,
        title: details.title,
        posterPath: details.posterPath,
        genreIds: details.genreIds,
        score: scoreToSave,
        review: reviewToSave,
      });
      setExistingScore(scoreToSave);
    } catch (e: any) {
      setSaveError(e?.message ?? 'Could not save your rating. Try again.');
    } finally {
      setSaving(false);
    }
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      // Accounts for the native stack header above this screen (see
      // MainStack.tsx's MovieDetail options) so 'padding' shifts content up
      // by the right amount instead of over/under-correcting.
      keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
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
        <View style={styles.scoreSlider}>
          <RatingSlider value={selectedScore} onChange={setSelectedScore} />
        </View>

        <AppTextInput
          label="Review (optional)"
          placeholder="What did you think?"
          value={reviewText}
          onChangeText={setReviewText}
          multiline
          numberOfLines={4}
          maxLength={MAX_REVIEW_LENGTH}
          style={styles.reviewInput}
        />

        {saveError ? <Text style={styles.saveErrorText}>{saveError}</Text> : null}
        <AppButton
          title={existingScore != null ? 'Update Rating' : 'Add to My List'}
          onPress={handleSave}
          loading={saving}
          disabled={saving}
          style={styles.saveButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl },
    center: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
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
    overview: {
      color: colors.text,
      fontSize: fontSize.sm,
      lineHeight: 20,
      marginBottom: spacing.lg,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: fontSize.md,
      fontWeight: '700',
      marginBottom: spacing.sm,
    },
    scoreSlider: { marginBottom: spacing.lg },
    reviewInput: { minHeight: 96, textAlignVertical: 'top' },
    saveButton: {},
    saveErrorText: { color: colors.danger, fontSize: fontSize.sm, marginBottom: spacing.sm },
  });
}
