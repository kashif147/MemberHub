import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  SafeAreaView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Colors } from '../../theme/colors';
import {
  extractOAuthParam,
  getPkceState,
  getPkceVerifier,
  isMicrosoftRedirect,
  startCrmMicrosoftAuthorization,
} from '../../helpers/microsoftAuth.helper';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSuccess: (payload: {
    code: string;
    codeVerifier: string;
    state: string;
  }) => void;
  onError: (message: string) => void;
};

/**
 * In-app Microsoft login — Portal_App pattern:
 * 1) GET /pkce/generate → authorizationUrls.azureAD (server stores state)
 * 2) WebView loads that URL
 * 3) Intercept redirect with code+state → POST /auth/azure-crm
 */
const WebViewMicrosoftLogin = ({
  visible,
  onClose,
  onSuccess,
  onError,
}: Props) => {
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [sessionVerifier, setSessionVerifier] = useState<string | null>(null);
  const [sessionState, setSessionState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const processedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setAuthUrl(null);
      setSessionVerifier(null);
      setSessionState(null);
      setLoading(true);
      setBusy(false);
      processedRef.current = null;
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const started = await startCrmMicrosoftAuthorization();
        if (!cancelled) {
          setSessionVerifier(started.codeVerifier);
          setSessionState(started.state);
          setAuthUrl(started.authUrl);
        }
      } catch (e: any) {
        onError(e?.message || 'Failed to start Microsoft sign-in');
        onClose();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [visible, onClose, onError]);

  const handleRedirect = async (url: string) => {
    if (!isMicrosoftRedirect(url) || busy) return;

    const error = extractOAuthParam(url, 'error');
    if (error) {
      const desc = extractOAuthParam(url, 'error_description') || error;
      if (error === 'access_denied' || desc.includes('cancelled')) {
        onClose();
        return;
      }
      onError(desc);
      onClose();
      return;
    }

    const code = extractOAuthParam(url, 'code');
    if (!code || processedRef.current === code) return;

    processedRef.current = code;
    setBusy(true);
    try {
      const codeVerifier =
        sessionVerifier || (await getPkceVerifier());
      if (!codeVerifier) {
        throw new Error('Missing PKCE verifier. Please try again.');
      }
      const state =
        extractOAuthParam(url, 'state') ||
        sessionState ||
        (await getPkceState());
      if (!state) {
        throw new Error('Missing OAuth state. Please try again.');
      }
      onSuccess({ code, codeVerifier, state });
    } catch (e: any) {
      onError(e?.message || 'Microsoft sign-in failed');
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet">
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Sign in with Microsoft</Text>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <Text style={styles.close}>Close</Text>
          </TouchableOpacity>
        </View>

        {(loading || busy || !authUrl) && (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loaderText}>
              {busy ? 'Completing sign-in…' : 'Opening Microsoft…'}
            </Text>
          </View>
        )}

        {authUrl ? (
          <WebView
            source={{ uri: authUrl }}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            originWhitelist={['*']}
            setSupportMultipleWindows={false}
            sharedCookiesEnabled
            thirdPartyCookiesEnabled
            javaScriptEnabled
            onShouldStartLoadWithRequest={req => {
              const { url } = req;
              if (isMicrosoftRedirect(url)) {
                handleRedirect(url);
                return false;
              }
              return true;
            }}
            onNavigationStateChange={nav => {
              if (nav?.url && isMicrosoftRedirect(nav.url)) {
                handleRedirect(nav.url);
              }
            }}
            startInLoadingState
            style={styles.webview}
          />
        ) : null}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  close: { fontSize: 15, color: Colors.primary, fontWeight: '600' },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    zIndex: 2,
  },
  loaderText: {
    marginTop: 10,
    color: Colors.textSecondary,
    fontSize: 13,
  },
  webview: { flex: 1 },
});

export default WebViewMicrosoftLogin;
