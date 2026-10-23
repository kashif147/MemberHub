import axios, { AxiosResponse } from 'axios';
import { API_BASE_URL } from '../constants/config';
import { getBearerToken } from '../helpers/auth.helper';
import {
  handleUnauthorizedResponse,
  rejectIfTokenExpired,
} from '../helpers/sessionExpiry.helper';

const request = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  validateStatus: () => true,
});

request.interceptors.request.use(async config => {
  // Login / PKCE calls must still work without a valid session token.
  const url = String(config.url || '');
  const isAuthCall = /\/auth(\/|$)|\/pkce\//i.test(url);
  if (!isAuthCall) {
    await rejectIfTokenExpired();
  }
  const token = await getBearerToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

request.interceptors.response.use(async (response: AxiosResponse) => {
  await handleUnauthorizedResponse({
    status: response.status,
    url: response.config?.url,
    message:
      (response.data as any)?.message ||
      (response.data as any)?.error?.message ||
      (response.data as any)?.error,
  });
  return response;
});

export default request;
