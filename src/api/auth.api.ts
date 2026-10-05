import request from './request';
import {
  AUTH_AZURE_CRM_PATH,
  AUTH_CREDENTIALS_PATH,
  AUTH_ME_PATH,
  AUTH_PKCE_GENERATE_PATH,
} from '../constants/config';

/** Backend issues PKCE + stores state (required by /auth/azure-crm). */
export const generatePkceRequest = (flow?: string) => {
  const config = flow ? { params: { flow } } : {};
  return request.get(AUTH_PKCE_GENERATE_PATH, config);
};

/**
 * CRM Microsoft exchange — same as Portal_App / backend handleAzureADCallback:
 * POST { code, codeVerifier, state }
 * Optional redirectUri must match the authorize URL from /pkce/generate.
 */
export const signInAzureCrmRequest = (data: {
  code: string;
  codeVerifier: string;
  state: string;
  redirectUri?: string;
}) => {
  const body: Record<string, string> = {
    code: data.code,
    codeVerifier: data.codeVerifier,
    state: data.state,
  };
  if (data.redirectUri) {
    body.redirectUri = data.redirectUri;
  }
  return request.post(AUTH_AZURE_CRM_PATH, body);
};

/** Username/password — mirrors ProjectShell-1 AuthSlice loginUser */
export const signInCredentialsRequest = (data: {
  username: string;
  password: string;
}) => request.post(AUTH_CREDENTIALS_PATH, data);

export const validationRequest = () => request.get(AUTH_ME_PATH);
