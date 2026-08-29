import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GoogleSigninButton } from '@react-native-google-signin/google-signin';
import AppButton from '../../components/AppButton';
import AppTextInput from '../../components/AppTextInput';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import { isGoogleSignInConfigured } from '../../services/googleAuth';
import { AppColors, fontSize, spacing } from '../../theme';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

export default function SignupScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList, 'Signup'>>();
  const { signUp, signInWithGoogle } = useAuth();
  const { colors, isDarkMode } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await signUp(email.trim(), password, username.trim());
    } catch (e: any) {
      setError(e?.message ?? 'Could not create your account.');
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
      setError(e?.message ?? 'Could not sign up with Google.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={styles.title}>Create your account</Text>
      <Text style={styles.subtitle}>Start ranking what you watch.</Text>

      <AppTextInput
        label="Username"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
        placeholder="moviefan22"
      />
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
        placeholder="At least 6 characters"
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <AppButton
        title="Sign up"
        onPress={handleSubmit}
        loading={loading}
        disabled={!email || !password || !username}
      />

      {isGoogleSignInConfigured ? (
        <>
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>
          <GoogleSigninButton
            style={styles.googleButton}
            size={GoogleSigninButton.Size.Wide}
            color={isDarkMode ? GoogleSigninButton.Color.Light : GoogleSigninButton.Color.Dark}
            onPress={handleGoogleSignIn}
            disabled={googleLoading}
          />
        </>
      ) : null}

      <AppButton
        title="Back to login"
        variant="secondary"
        onPress={() => navigation.navigate('Login')}
        style={styles.backButton}
      />
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
    googleButton: { width: '100%', height: 48 },
    backButton: { marginTop: spacing.md },
  });
}
