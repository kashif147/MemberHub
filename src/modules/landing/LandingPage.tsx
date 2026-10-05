import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { User } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import {
  signInAsBranchOfficer,
  signInWithMicrosoft,
} from '../../services/auth.services';
import WebViewMicrosoftLogin from '../../common/WebViewMicrosoftLogin';
import type { AppDispatch, RootState } from '../../store';

/** Microsoft logo 2x2 squares */
const MicrosoftLogo = () => (
  <View style={ms.grid}>
    <View style={[ms.sq, { backgroundColor: '#F25022' }]} />
    <View style={[ms.sq, { backgroundColor: '#7FBA00' }]} />
    <View style={[ms.sq, { backgroundColor: '#00A4EF' }]} />
    <View style={[ms.sq, { backgroundColor: '#FFB900' }]} />
  </View>
);

const ms = StyleSheet.create({
  grid: {
    width: 18,
    height: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 1.5,
  },
  sq: { width: 8, height: 8 },
});

/**
 * Welcome Back landing — Microsoft SSO like ProjectShell-1 Login.js.
 */
const LandingPage = () => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();
  const isLoading = useSelector((s: RootState) => s.auth.isLoading);
  const [showMsLogin, setShowMsLogin] = useState(false);
  const [busy, setBusy] = useState(false);

  const loading = busy || isLoading;

  const onMicrosoftSuccess = async (payload: {
    code: string;
    codeVerifier: string;
    state: string;
  }) => {
    setShowMsLogin(false);
    setBusy(true);
    const result = await dispatch(signInWithMicrosoft(payload));
    setBusy(false);
    if (!result?.ok) {
      const msg =
        typeof result?.message === 'string'
          ? result.message
          : 'Microsoft authentication failed. You can continue with demo mode.';
      Alert.alert('Sign in failed', msg);
    }
  };

  const onDemoSignIn = async () => {
    setBusy(true);
    await dispatch(signInAsBranchOfficer());
    setBusy(false);
  };

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
      ]}>
      <View style={styles.card}>
        <View style={styles.avatarRing}>
          <View style={styles.avatar}>
            <User size={36} color={Colors.white} strokeWidth={2} />
          </View>
        </View>

        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Choose your preferred sign-in method</Text>

        <TouchableOpacity
          style={[styles.msBtn, loading && styles.btnDisabled]}
          disabled={loading}
          onPress={() => setShowMsLogin(true)}
          activeOpacity={0.88}>
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <MicrosoftLogo />
              <Text style={styles.msBtnText}>Sign in with Microsoft</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>Or</Text>
          <View style={styles.divider} />
        </View>

        <TouchableOpacity
          style={styles.demoBtn}
          disabled={loading}
          onPress={onDemoSignIn}
          activeOpacity={0.85}>
          <Text style={styles.demoBtnText}>Continue as Branch Officer (demo)</Text>
        </TouchableOpacity>
      </View>

      <WebViewMicrosoftLogin
        visible={showMsLogin}
        onClose={() => setShowMsLogin(false)}
        onSuccess={onMicrosoftSuccess}
        onError={msg => {
          setShowMsLogin(false);
          Alert.alert('Microsoft sign-in', msg);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#EEF2F8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingHorizontal: 28,
    paddingVertical: 36,
    alignItems: 'center',
    shadowColor: '#1A3A6B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E8F0FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1B3A6B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1B3A6B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7C93',
    marginBottom: 28,
    textAlign: 'center',
  },
  msBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#2F6FED',
    borderRadius: 10,
    paddingVertical: 14,
    minHeight: 52,
  },
  msBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  btnDisabled: { opacity: 0.75 },
  dividerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
    gap: 12,
  },
  divider: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  dividerText: { color: '#94A3B8', fontSize: 13, fontWeight: '500' },
  demoBtn: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  demoBtnText: {
    color: '#2F6FED',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LandingPage;
