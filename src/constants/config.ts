/**
 * MemberHub talks to the same CRM backend as ProjectShell-1.
 * Override API_BASE_URL when wiring a real environment.
 */
export { MEMBERHUB_REDIRECT_URI as MEMBERHUB_REDIRECT_SCHEME } from './azureAd';

export const API_BASE_URL = 'https://projectshell-vm.northeurope.cloudapp.azure.com:8443/user-service';

/** CRM Azure AD token exchange — same contract as ProjectShell-1 Login.js */
export const AUTH_AZURE_CRM_PATH = '/auth/azure-crm';

/** Backend PKCE start — stores state used by /auth/azure-crm */
export const AUTH_PKCE_GENERATE_PATH = '/pkce/generate';

/** Username/password login — same as ProjectShell-1 AuthSlice loginUser */
export const AUTH_CREDENTIALS_PATH = '/auth';

export const AUTH_ME_PATH = '/api/me';

/**
 * Must match ProjectShell-1 REACT_APP_JWT_SECRET for decrypting CRM accessToken.
 * Prefer injecting via CI / env for production builds.
 */
export const JWT_SECRET = '32704701374fhfwefgwefwisagfiwudsgfui';

export const STORAGE_KEYS = {
  TOKEN: 'memberhub_token',
  REFRESH_TOKEN: 'memberhub_refresh_token',
  USER: 'memberhub_user',
  LOGIN: 'memberhub_login',
} as const;
