import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { Colors } from '../../theme/colors';
import {
  signInAsBranchOfficer,
  signInWithCredentials,
} from '../../services/auth.services';
import type { AppDispatch, RootState } from '../../store';

/**
 * Landing / sign-in — structured like Portal_App LandingPage.
 * Primary path: CRM credentials (ProjectShell-1 /auth).
 * Secondary: demo Branch Officer session for UI work without API.
 */
const LandingPage = () => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();
  const isLoading = useSelector((s: RootState) => s.auth.isLoading);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const onCredentialsSignIn = async () => {
    if (!username.trim() || !password) {
      Alert.alert('Sign in', 'Enter username and password.');
      return;
    }
    setBusy(true);
    const result = await dispatch(signInWithCredentials(username.trim(), password));
    setBusy(false);
    if (!result?.ok) {
      Alert.alert(
        'Sign in failed',
        result?.message ||
          'Could not reach CRM auth. Use Continue as Branch Officer for demo.',
      );
    }
  };

  const onDemoSignIn = async () => {
    setBusy(true);
    await dispatch(signInAsBranchOfficer());
    setBusy(false);
  };

  const loading = busy || isLoading;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 40 },
        ]}
        keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <View style={styles.logoMark}>
            <Text style={styles.logoMarkText}>MH</Text>
          </View>
          <Text style={styles.title}>MemberHub</Text>
          <Text style={styles.subtitle}>
            Sign in with your CRM Branch Officer account to manage members and
            cases in your scope.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="CRM username / email"
            placeholderTextColor={Colors.textPlaceholder}
            value={username}
            onChangeText={setUsername}
          />
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            placeholder="Password"
            placeholderTextColor={Colors.textPlaceholder}
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.btnDisabled]}
            disabled={loading}
            onPress={onCredentialsSignIn}
            activeOpacity={0.85}>
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.primaryBtnText}>Sign in with CRM</Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity
            style={styles.secondaryBtn}
            disabled={loading}
            onPress={onDemoSignIn}
            activeOpacity={0.85}>
            <Text style={styles.secondaryBtnText}>
              Continue as Branch Officer (demo)
            </Text>
          </TouchableOpacity>

          <Text style={styles.hint}>
            CRM sign-in uses the same `/auth` endpoint as ProjectShell-1.
            Microsoft mobile SSO can be wired via `/auth/azure-crm` when the
            redirect URI is registered.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  hero: { marginBottom: 28 },
  logoMark: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  logoMarkText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.white,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 15,
    color: Colors.textPrimary,
    backgroundColor: Colors.surfaceMuted,
  },
  primaryBtn: {
    marginTop: 20,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  secondaryBtnText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  btnDisabled: { opacity: 0.7 },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 10,
  },
  divider: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { color: Colors.textMuted, fontSize: 12 },
  hint: {
    marginTop: 16,
    fontSize: 11,
    lineHeight: 16,
    color: Colors.textMuted,
  },
});

export default LandingPage;
