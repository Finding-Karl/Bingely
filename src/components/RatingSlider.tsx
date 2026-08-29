import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { useAppTheme } from '../context/ThemeContext';
import { AppColors, fontSize, spacing } from '../theme';

const MIN_SCORE = 1;
const MAX_SCORE = 10;
const STEP = 0.1;

/** Snap to the nearest tenth - the slider library's own step handling can
 * still hand back values like 7.199999999999999 from floating-point drift. */
function roundToTenth(value: number): number {
  return Math.round(value * 10) / 10;
}

export default function RatingSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View>
      <View style={styles.valueRow}>
        <Text style={styles.value}>{value.toFixed(1)}</Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={MIN_SCORE}
        maximumValue={MAX_SCORE}
        step={STEP}
        value={value}
        onValueChange={v => onChange(roundToTenth(v))}
        minimumTrackTintColor={colors.primary}
        maximumTrackTintColor={colors.border}
        thumbTintColor={colors.primary}
      />
      <View style={styles.endLabelRow}>
        <Text style={styles.endLabel}>{MIN_SCORE.toFixed(1)}</Text>
        <Text style={styles.endLabel}>{MAX_SCORE.toFixed(1)}</Text>
      </View>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    valueRow: { alignItems: 'center', marginBottom: spacing.xs },
    value: { color: colors.text, fontSize: fontSize.xl, fontWeight: '800' },
    slider: { width: '100%', height: 40 },
    endLabelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: -spacing.xs,
    },
    endLabel: { color: colors.textMuted, fontSize: fontSize.xs },
  });
}
