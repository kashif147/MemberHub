import request from './request';
import {
  AUTH_AZURE_CRM_PATH,
  AUTH_CREDENTIALS_PATH,
  AUTH_ME_PATH,
  MEMBERHUB_REDIRECT_SCHEME,
} from '../constants/config';

/** Same CRM Microsoft exchange as ProjectShell-1 Login.js */
export const signInAzureCrmRequest = (data: {
  code: string;
  codeVerifier: string;
  redirectUri?: string;
}) =>
  request.post(AUTH_AZURE_CRM_PATH, {
    ...data,
    redirectUri: data.redirectUri || MEMBERHUB_REDIRECT_SCHEME,
  });

/** Username/password — mirrors ProjectShell-1 AuthSlice loginUser */
export const signInCredentialsRequest = (data: {
  username: string;
  password: string;
}) => request.post(AUTH_CREDENTIALS_PATH, data);

export const validationRequest = () => request.get(AUTH_ME_PATH);
