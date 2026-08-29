import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AppButton from '../components/AppButton';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';
import { AppColors, fontSize, radius, spacing } from '../theme';
import type { MainStackParamList } from '../navigation/MainStack';

export default function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { user, signOut } = useAuth();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View>
        <Text style={styles.heading}>Profile</Text>
        <View style={styles.card}>
          <Text style={styles.email}>{user?.email}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <AppButton
          title="Settings"
          variant="secondary"
          onPress={() => navigation.navigate('Settings')}
          style={styles.settingsButton}
        />
        <AppButton title="Log out" variant="secondary" onPress={() => signOut()} />
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: spacing.lg,
      justifyContent: 'space-between',
    },
    heading: {
      color: colors.text,
      fontSize: fontSize.xl,
      fontWeight: '800',
      marginBottom: spacing.md,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
    },
    email: { color: colors.text, fontSize: fontSize.md },
    actions: {},
    settingsButton: { marginBottom: spacing.sm },
  });
}
