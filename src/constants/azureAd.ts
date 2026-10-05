import { Platform } from 'react-native';

/**
 * Azure AD app registration for MemberHub (native).
 * Redirect URIs must match Azure AD exactly (platform-specific).
 */
export const AZURE_AD = {
  tenantId: '39866a06-30bc-4a89-80c6-9dd9357dd453',
  clientId: 'a7b752e6-ec3a-46f5-bb10-cf6c7dc1db89',
  scopes: 'openid profile email offline_access',
  authorityHost: 'https://login.microsoftonline.com',
} as const;

/** Platform redirect URIs registered in Azure AD */
export const MEMBERHUB_REDIRECT_URIS = {
  ios: 'com.memberhub://com.memberhub/ios/callback',
  android: 'com.memberhub://com.memberhub/android/callback',
} as const;

/** Active redirect URI for this build — must match authorize + token exchange */
export const MEMBERHUB_REDIRECT_URI =
  Platform.OS === 'android'
    ? MEMBERHUB_REDIRECT_URIS.android
    : MEMBERHUB_REDIRECT_URIS.ios;

export const PKCE_STORAGE_KEY = 'memberhub_pkce_code_verifier';
export const PKCE_STATE_KEY = 'memberhub_pkce_state';
