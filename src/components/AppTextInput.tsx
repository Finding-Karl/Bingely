import React, { useMemo } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { useAppTheme } from '../context/ThemeContext';
import { AppColors, fontSize, radius, spacing } from '../theme';

interface Props extends TextInputProps {
  label?: string;
  error?: string | null;
}

export default function AppTextInput({ label, error, style, ...rest }: Props) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[styles.input, error ? styles.inputError : null, style]}
        {...rest}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    container: { marginBottom: spacing.md },
    label: { color: colors.textMuted, fontSize: fontSize.sm, marginBottom: spacing.xs },
    input: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      color: colors.text,
      fontSize: fontSize.md,
    },
    inputError: { borderColor: colors.danger },
    error: { color: colors.danger, fontSize: fontSize.xs, marginTop: spacing.xs },
  });
}
