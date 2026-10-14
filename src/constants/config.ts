/**
 * MemberHub talks to the same CRM backend as ProjectShell-1.
 */
export { MEMBERHUB_REDIRECT_URI as MEMBERHUB_REDIRECT_SCHEME } from './azureAd';

/** User-service (auth / pkce) */
export const API_BASE_URL =
  'https://projectshell-vm.northeurope.cloudapp.azure.com:8443/user-service';

/**
 * Policy lookups / products — same as ProjectShell-1 REACT_APP_POLICY_SERVICE_URL.
 * Includes `/api` suffix.
 */
export const POLICY_SERVICE_URL = `${API_BASE_URL}/api`;

/**
 * Profile application CRUD — same as ProjectShell-1 REACT_APP_PROFILE_SERVICE_URL.
 */
export const PROFILE_SERVICE_URL =
  'https://projectshell-vm.northeurope.cloudapp.azure.com:8443/profile-service/api';

/**
 * Subscription members filter — same as ProjectShell-1 REACT_APP_SUBSCRIPTION.
 */
export const SUBSCRIPTION_SERVICE_URL =
  'https://projectshell-vm.northeurope.cloudapp.azure.com:8443/subscription-service/api/v1';

/**
 * Issue / complaints service — same host pattern as ProjectShell-1
 * REACT_APP_ISSUE_SERVICE_URL (sibling of profile-service).
 */
export const ISSUE_SERVICE_URL =
  'https://projectshell-vm.northeurope.cloudapp.azure.com:8443/issue-service/api';

/** System-default Members grid template (CRM /members filter). */
export const MEMBERS_FILTER_TEMPLATE_ID = '69ec6b70ed31fde95f0d478e';

/** CRM Azure AD token exchange */
export const AUTH_AZURE_CRM_PATH = '/auth/azure-crm';

/** Backend PKCE start — stores state used by /auth/azure-crm */
export const AUTH_PKCE_GENERATE_PATH = '/pkce/generate';

export const AUTH_CREDENTIALS_PATH = '/auth';

export const AUTH_ME_PATH = '/api/me';

/** Membership category product type (CRM CategoryLookupSlice / Portal) */
export const MEMBERSHIP_CATEGORY_TYPE_ID = '68dae613c5b15073d66b891f';

/** Work location hierarchy lookup type */
export const WORKLOCATION_LOOKUPTYPE_ID = '68d036e2662428d1c504b3ad';

/**
 * Must match ProjectShell-1 REACT_APP_JWT_SECRET for decrypting CRM accessToken.
 */
export const JWT_SECRET = '32704701374fhfwefgwefwisagfiwudsgfui';

export const STORAGE_KEYS = {
  TOKEN: 'memberhub_token',
  REFRESH_TOKEN: 'memberhub_refresh_token',
  USER: 'memberhub_user',
  LOGIN: 'memberhub_login',
} as const;
