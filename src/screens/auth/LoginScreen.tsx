import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AppButton from '../../components/AppButton';
import AppTextInput from '../../components/AppTextInput';
import { useAuth } from '../../context/AuthContext';
import { colors, fontSize, spacing } from '../../theme';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

export default function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList, 'Login'>>();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (e: any) {
      setError(e?.message ?? 'Could not sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.subtitle}>Log in to see your rankings.</Text>

      <AppTextInput
        label="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
      />
      <AppTextInput
        label="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        placeholder="••••••••"
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <AppButton title="Log in" onPress={handleSubmit} loading={loading} disabled={!email || !password} />

      <View style={styles.footer}>
        <Text style={styles.footerText}>New to Bingely?</Text>
        <AppButton title="Create an account" variant="secondary" onPress={() => navigation.navigate('Signup')} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', padding: spacing.lg },
  title: { color: colors.text, fontSize: fontSize.xl, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: fontSize.md, marginTop: spacing.xs, marginBottom: spacing.xl },
  errorText: { color: colors.danger, marginBottom: spacing.md },
  footer: { marginTop: spacing.xl },
  footerText: { color: colors.textMuted, textAlign: 'center', marginBottom: spacing.sm },
});
