/**
 * MemberHub talks to the same CRM backend as ProjectShell-1.
 * Override API_BASE_URL when wiring a real environment.
 */
export const API_BASE_URL = 'https://project-shell-api.vercel.app';

/** Deep link scheme registered for MemberHub (Azure AD redirect). */
export const MEMBERHUB_REDIRECT_SCHEME = 'com.memberhub://auth/callback';

/** CRM Azure AD token exchange — same contract as ProjectShell-1 Login.js */
export const AUTH_AZURE_CRM_PATH = '/auth/azure-crm';

/** Username/password login — same as ProjectShell-1 AuthSlice loginUser */
export const AUTH_CREDENTIALS_PATH = '/auth';

export const AUTH_ME_PATH = '/api/me';

export const STORAGE_KEYS = {
  TOKEN: 'memberhub_token',
  REFRESH_TOKEN: 'memberhub_refresh_token',
  USER: 'memberhub_user',
  LOGIN: 'memberhub_login',
} as const;
