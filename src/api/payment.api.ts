import axios, { AxiosResponse } from 'axios';
import { ACCOUNT_SERVICE_URL } from '../constants/config';
import { getBearerToken } from '../helpers/auth.helper';
import {
  handleUnauthorizedResponse,
  rejectIfTokenExpired,
} from '../helpers/sessionExpiry.helper';

const makeIdempotencyKey = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 12)}-${Math.random()
    .toString(36)
    .slice(2, 12)}`;

/**
 * Portal_App payment_request — account-service + idempotency key.
 * validateStatus always resolves so callers can inspect status.
 */
const paymentRequest = axios.create({
  baseURL: ACCOUNT_SERVICE_URL,
  timeout: 45000,
  headers: { 'Content-Type': 'application/json' },
  validateStatus: () => true,
});

paymentRequest.interceptors.request.use(async config => {
  await rejectIfTokenExpired();
  const token = await getBearerToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['x-idempotency-key'] = makeIdempotencyKey();
  return config;
});

paymentRequest.interceptors.response.use(async (response: AxiosResponse) => {
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

/** POST /api/payments/intents — Portal subscriptionFee / checkout session */
export const createPaymentIntentRequest = (data: Record<string, any>) =>
  paymentRequest.post('/api/payments/intents/', data);
