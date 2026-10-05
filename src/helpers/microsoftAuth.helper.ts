import AsyncStorage from '@react-native-async-storage/async-storage';
import { generatePkceRequest } from '../api/auth.api';
import {
  MEMBERHUB_REDIRECT_URI,
  PKCE_STATE_KEY,
  PKCE_STORAGE_KEY,
} from '../constants/azureAd';

const REDIRECT_URI_KEY = 'memberhub_pkce_redirect_uri';

/** Normalize /pkce/generate whether fields are top-level or under data. */
export const normalizePkcePayload = (response: any) => {
  const root = response?.data ?? response ?? {};
  const nested =
    root?.data && typeof root.data === 'object' ? root.data : null;
  return {
    ...root,
    ...(nested || {}),
    authorizationUrls:
      nested?.authorizationUrls || root?.authorizationUrls || {},
    codeVerifier: nested?.codeVerifier || root?.codeVerifier || null,
    state: nested?.state || root?.state || null,
  };
};

export const extractOAuthParam = (url: string, key: string): string | null => {
  if (!url || !key) return null;
  try {
    const cleaned = url.replace(/^REDIRECT:/, '').trim();
    const parsed = new URL(cleaned);
    const fromSearch = parsed.searchParams.get(key);
    if (fromSearch) return fromSearch;
  } catch {
    // Custom schemes / odd URLs — fall through to regex
  }
  try {
    const cleaned = url.replace(/^REDIRECT:/, '').trim();
    const match = cleaned.match(new RegExp(`[?&#]${key}=([^&#]+)`));
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
};

export const persistPkce = async (
  codeVerifier: string,
  state: string,
  redirectUri?: string | null,
) => {
  await Promise.all([
    AsyncStorage.setItem(PKCE_STORAGE_KEY, codeVerifier),
    AsyncStorage.setItem(PKCE_STATE_KEY, state),
    redirectUri
      ? AsyncStorage.setItem(REDIRECT_URI_KEY, redirectUri)
      : AsyncStorage.removeItem(REDIRECT_URI_KEY),
  ]);
};

export const getPkceVerifier = async () =>
  AsyncStorage.getItem(PKCE_STORAGE_KEY);

export const getPkceState = async () => AsyncStorage.getItem(PKCE_STATE_KEY);

export const getPkceRedirectUri = async () =>
  AsyncStorage.getItem(REDIRECT_URI_KEY);

export const clearPkce = async () => {
  await Promise.all([
    AsyncStorage.removeItem(PKCE_STORAGE_KEY),
    AsyncStorage.removeItem(PKCE_STATE_KEY),
    AsyncStorage.removeItem(REDIRECT_URI_KEY),
  ]);
};

/**
 * Start CRM Microsoft SSO via backend GET /pkce/generate.
 * Uses authorizationUrls.azureAD (state is server-stored — required by azure-crm).
 * Do NOT invent client-side state; backend rejects unknown/expired state.
 */
export const startCrmMicrosoftAuthorization = async () => {
  const response = await generatePkceRequest();
  const payload = normalizePkcePayload(response);

  if (!(response?.status >= 200 && response?.status < 300) || !payload) {
    await clearPkce();
    const msg =
      payload?.error?.message ||
      payload?.message ||
      payload?.error ||
      'Failed to start Microsoft sign-in. Please try again.';
    throw new Error(typeof msg === 'string' ? msg : 'Failed to start sign-in');
  }

  const codeVerifier = payload.codeVerifier as string | null;
  const authUrl =
    payload.authorizationUrls?.azureAD ||
    payload.authorizationUrl ||
    null;

  if (!codeVerifier || !authUrl) {
    await clearPkce();
    throw new Error('Authentication challenge was incomplete. Please try again.');
  }

  // azureAD URL has its own state (different from top-level B2C state)
  const stateFromUrl = extractOAuthParam(authUrl, 'state');
  const state = stateFromUrl || payload.state || null;
  if (!state) {
    await clearPkce();
    throw new Error('Authentication state was missing. Please try again.');
  }

  const redirectUri =
    extractOAuthParam(authUrl, 'redirect_uri') ||
    'https://project-shell-crm-dev.vercel.app/auth/azure-crm';

  await persistPkce(codeVerifier, state, redirectUri);

  return {
    authUrl,
    codeVerifier,
    state,
    redirectUri,
  };
};

/** @deprecated Prefer startCrmMicrosoftAuthorization (backend PKCE). */
export const buildMicrosoftAuthorizeUrl = startCrmMicrosoftAuthorization;

/**
 * CRM callback: HTTPS redirect from azureAD authorize URL, or MemberHub deep link.
 */
export const isMicrosoftRedirect = (url: string) => {
  if (!url) return false;
  if (url.startsWith(MEMBERHUB_REDIRECT_URI)) return true;
  if (url.startsWith('com.memberhub://')) return true;
  // Backend azureAD redirect_uri (WebView intercept before page loads)
  if (
    (url.startsWith('https://') || url.startsWith('http://')) &&
    url.includes('code=') &&
    url.includes('state=') &&
    (url.includes('/auth/azure-crm') ||
      url.includes('project-shell-crm') ||
      url.includes('code='))
  ) {
    return url.includes('code=') && url.includes('state=');
  }
  return false;
};
