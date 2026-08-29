import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useAppTheme } from '../context/ThemeContext';
import { AppColors, fontSize, radius, spacing } from '../theme';
import { auth } from '../services/firebase';
import { postgresApi } from '../services/postgresApi';

export default function SettingsScreen() {
  const { colors, isDarkMode, setDarkMode } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [testingBackend, setTestingBackend] = useState(false);

  async function handleTestBackend() {
    setTestingBackend(true);
    try {
      const username = auth.currentUser?.email?.split('@')[0] ?? `poc_user_${Date.now()}`;
      const upsertResult = await postgresApi.put('/profile/me', {
        username,
        usernameLower: username.toLowerCase(),
        displayName: username,
        email: auth.currentUser?.email ?? 'poc@example.com',
      });
      const profile = await postgresApi.get('/profile/me');
      Alert.alert(
        'Backend round-trip succeeded',
        `PUT /profile/me: ${JSON.stringify(upsertResult)}\n\nGET /profile/me: ${JSON.stringify(profile)}`,
      );
    } catch (error) {
      Alert.alert('Backend request failed', error instanceof Error ? error.message : String(error));
    } finally {
      setTestingBackend(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Appearance</Text>
      <View style={styles.row}>
        <View style={styles.rowText}>
          <Text style={styles.rowLabel}>Dark Mode</Text>
          <Text style={styles.rowHint}>Off by default - switch the app to a dark color scheme.</Text>
        </View>
        <Switch
          value={isDarkMode}
          onValueChange={setDarkMode}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.surface}
        />
      </View>

      <Text style={styles.sectionTitle}>Developer</Text>
      <Pressable
        style={styles.row}
        onPress={handleTestBackend}
        disabled={testingBackend}
        android_ripple={{ color: colors.border }}>
        <View style={styles.rowText}>
          <Text style={styles.rowLabel}>Test Postgres backend</Text>
          <Text style={styles.rowHint}>
            Calls PUT then GET /profile/me against the deployed Cloud Function and Postgres.
          </Text>
        </View>
        {testingBackend ? <ActivityIndicator color={colors.primary} /> : null}
      </Pressable>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, paddingTop: spacing.lg },
    sectionTitle: {
      color: colors.textMuted,
      fontSize: fontSize.sm,
      fontWeight: '700',
      textTransform: 'uppercase',
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.sm,
      marginTop: spacing.lg,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      marginHorizontal: spacing.lg,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    rowText: { flex: 1, marginRight: spacing.md },
    rowLabel: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
    rowHint: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: spacing.xs },
  });
}
