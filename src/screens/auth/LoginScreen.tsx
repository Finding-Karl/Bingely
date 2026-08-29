import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AppButton from '../../components/AppButton';
import AppTextInput from '../../components/AppTextInput';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import { isGoogleSignInConfigured } from '../../services/googleAuth';
import { AppColors, fontSize, spacing } from '../../theme';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

export default function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList, 'Login'>>();
  const { signIn, signInWithGoogle } = useAuth();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (e: any) {
      setError(e?.message ?? 'Could not sign in with Google.');
    } finally {
      setGoogleLoading(false);
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

      {isGoogleSignInConfigured ? (
        <>
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>
          <AppButton
            title="Continue with Google"
            icon="logo-google"
            variant="secondary"
            onPress={handleGoogleSignIn}
            loading={googleLoading}
            disabled={googleLoading}
          />
        </>
      ) : null}

      <View style={styles.footer}>
        <Text style={styles.footerText}>New to Bingely?</Text>
        <AppButton title="Create an account" variant="secondary" onPress={() => navigation.navigate('Signup')} />
      </View>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', padding: spacing.lg },
    title: { color: colors.text, fontSize: fontSize.xl, fontWeight: '800' },
    subtitle: {
      color: colors.textMuted,
      fontSize: fontSize.md,
      marginTop: spacing.xs,
      marginBottom: spacing.xl,
    },
    errorText: { color: colors.danger, marginBottom: spacing.md },
    divider: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.lg },
    dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
    dividerText: { color: colors.textMuted, fontSize: fontSize.sm, marginHorizontal: spacing.sm },
    footer: { marginTop: spacing.xl },
    footerText: { color: colors.textMuted, textAlign: 'center', marginBottom: spacing.sm },
  });
}
