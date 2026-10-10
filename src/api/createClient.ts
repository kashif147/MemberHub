import axios, { AxiosInstance } from 'axios';
import { getBearerToken } from '../helpers/auth.helper';

/** Axios client with bearer auth; validateStatus always resolves like Portal. */
export const createAuthedClient = (baseURL: string): AxiosInstance => {
  const client = axios.create({
    baseURL,
    timeout: 45000,
    headers: { 'Content-Type': 'application/json' },
    validateStatus: () => true,
  });

  client.interceptors.request.use(async config => {
    const token = await getBearerToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return client;
};
