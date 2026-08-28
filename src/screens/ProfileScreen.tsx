import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AppButton from '../components/AppButton';
import { useAuth } from '../context/AuthContext';
import { colors, fontSize, radius, spacing } from '../theme';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.heading}>Profile</Text>
        <View style={styles.card}>
          <Text style={styles.email}>{user?.email}</Text>
        </View>
      </View>
      <AppButton title="Log out" variant="secondary" onPress={() => signOut()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  heading: { color: colors.text, fontSize: fontSize.xl, fontWeight: '800', marginBottom: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  email: { color: colors.text, fontSize: fontSize.md },
});
