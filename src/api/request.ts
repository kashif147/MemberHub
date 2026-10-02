import axios from 'axios';
import { API_BASE_URL } from '../constants/config';
import { getBearerToken } from '../helpers/auth.helper';

const request = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  validateStatus: () => true,
});

request.interceptors.request.use(async config => {
  const token = await getBearerToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default request;
