import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { getBearerToken } from '../helpers/auth.helper';
import {
  handleUnauthorizedResponse,
  rejectIfTokenExpired,
} from '../helpers/sessionExpiry.helper';

const attachSessionInterceptors = (client: AxiosInstance) => {
  client.interceptors.request.use(async config => {
    await rejectIfTokenExpired();
    const token = await getBearerToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Let RN set multipart boundary — same as Portal_App issue_request.
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  });

  client.interceptors.response.use(async (response: AxiosResponse) => {
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
};

/** Axios client with bearer auth; validateStatus always resolves like Portal. */
export const createAuthedClient = (baseURL: string): AxiosInstance => {
  const client = axios.create({
    baseURL,
    timeout: 45000,
    headers: { 'Content-Type': 'application/json' },
    validateStatus: () => true,
  });

  attachSessionInterceptors(client);
  return client;
};
