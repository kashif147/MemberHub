import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import Svg, { Defs, Rect, RadialGradient, Stop } from 'react-native-svg';
import { Fingerprint, ShieldCheck } from 'lucide-react-native';
import MemberHubIcon from '../../components/MemberHubIcon';
import {
  signInAsBranchOfficer,
  signInWithMicrosoft,
} from '../../services/auth.services';
import WebViewMicrosoftLogin from '../../common/WebViewMicrosoftLogin';
import { Colors, FontFamily, Radii } from '../../theme';
import type { AppDispatch, RootState } from '../../store';

const { width: W, height: H } = Dimensions.get('window');

const C = {
  bg: Colors.background,
  surface: Colors.surface,
  text: Colors.textPrimary,
  accent: Colors.primary,
  accent800: Colors.primaryLight,
  neutral300: Colors.textSecondary,
  divider: 'rgba(41,43,49,0.12)',
};

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
    width: 17.5,
    height: 17.5,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 1.5,
  },
  sq: { width: 8, height: 8 },
});

/**
 * Sign in — Microsoft + Face ID, role note from CRM (HTML 1e).
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
          : 'Microsoft authentication failed. You can continue with Face ID demo.';
      Alert.alert('Sign in failed', msg);
    }
  };

  const onFaceId = async () => {
    setBusy(true);
    await dispatch(signInAsBranchOfficer());
    setBusy(false);
  };

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + 56, paddingBottom: insets.bottom + 40 },
      ]}>
      {/* radial-gradient(90% 40% at 80% 0%, #e7e5fe, #f4f5fa 70%) */}
      <Svg width={W} height={H} style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <RadialGradient
            id="signInGlow"
            cx={W * 0.8}
            cy={0}
            rx={W * 0.9}
            ry={H * 0.4}
            fx={W * 0.8}
            fy={0}
            gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#E7E5FE" />
            <Stop offset="0.7" stopColor="#F4F5FA" />
            <Stop offset="1" stopColor="#F4F5FA" />
          </RadialGradient>
        </Defs>
        <Rect width={W} height={H} fill="url(#signInGlow)" />
      </Svg>

      <View style={styles.iconWrap}>
        <MemberHubIcon size={72} radiusRatio={0.236} />
      </View>

      <View style={styles.heading}>
        <Text style={styles.title}>Sign in to MemberHub</Text>
        <Text style={styles.subtitle}>Use your Microsoft account.</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.secondaryBtn, loading && styles.btnDisabled]}
          disabled={loading}
          onPress={() => setShowMsLogin(true)}
          activeOpacity={0.88}>
          {loading ? (
            <ActivityIndicator color={C.accent} />
          ) : (
            <>
              <MicrosoftLogo />
              <Text style={styles.secondaryBtnText}>Sign in with Microsoft</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryBtn, loading && styles.btnDisabled]}
          disabled={loading}
          onPress={onFaceId}
          activeOpacity={0.88}>
          <Fingerprint size={18} color={C.text} strokeWidth={1.8} />
          <Text style={styles.secondaryBtnText}>Use Face ID</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.note}>
        <ShieldCheck size={18} color={C.accent} strokeWidth={1.8} style={styles.noteIcon} />
        <Text style={styles.noteText}>
          Your role (Regional Officer, Branch Officer or IRO) and the members you
          can see are set in the CRM.
        </Text>
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
    backgroundColor: C.bg,
    paddingHorizontal: 28,
  },
  iconWrap: {
    shadowColor: '#3D3470',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
    borderRadius: 17,
    alignSelf: 'flex-start',
  },
  heading: {
    marginTop: 24,
    gap: 6,
  },
  title: {
    fontFamily: FontFamily.medium,
    fontSize: 26,
    color: C.text,
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: C.neutral300,
  },
  actions: {
    marginTop: 28,
    gap: 14,
  },
  secondaryBtn: {
    width: '100%',
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: C.surface,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: C.divider,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  secondaryBtnText: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: C.text,
  },
  btnDisabled: { opacity: 0.7 },
  note: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: Radii.lg,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noteIcon: { marginTop: 1 },
  noteText: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 12,
    lineHeight: 18,
    color: C.neutral300,
  },
});

export default LandingPage;
