import { PROFILE_SERVICE_URL } from '../constants/config';
import { createAuthedClient } from './createClient';

/**
 * Deferred payment links — profile-service
 * POST /applications/:applicationId/payment-link
 * GET  /applications/:applicationId/payment
 *
 * Channel MEMBERSHUB matches applicationPaymentLink.controller staffContext.
 */
const profile = createAuthedClient(PROFILE_SERVICE_URL);

const unwrap = (res: any) => res?.data?.data ?? res?.data;

export type PaymentLinkAction = 'ISSUE' | 'RESEND' | 'REPLACE';

export type PaymentOption = 'FULL' | 'FIRST_INSTALMENT';

export type ApplicationPaymentView = {
  mode?: string;
  status: string;
  reason?: string | null;
  paymentOption?: PaymentOption | null;
  pricingBasis?: string | null;
  linkVersion?: number;
  checkoutUrl?: string | null;
  expiresAt?: string | null;
  authorisationExpiresAt?: string | null;
  amount?: number | null;
  currency?: string | null;
  approvalReady?: boolean;
  updatedAt?: string | null;
};

export const makePaymentLinkIdempotencyKey = (suffix = '') =>
  `mh-pl-${Date.now()}-${Math.random().toString(36).slice(2, 10)}${
    suffix ? `-${suffix}` : ''
  }`.slice(0, 100);

const memberHubHeaders = (idempotencyKey?: string) => {
  const headers: Record<string, string> = {
    'x-client-channel': 'MEMBERSHUB',
  };
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }
  return headers;
};

/**
 * POST /applications/:id/payment-link
 * Requires Idempotency-Key (max 100) — controller applicationPaymentLink.
 */
export const requestApplicationPaymentLinkRequest = async (
  applicationId: string,
  body: { action: PaymentLinkAction; paymentOption?: PaymentOption },
  idempotencyKey: string,
) => {
  const res = await profile.post(
    `/applications/${encodeURIComponent(applicationId)}/payment-link`,
    body,
    { headers: memberHubHeaders(idempotencyKey) },
  );
  return {
    status: res.status,
    data: unwrap(res),
    error: res.data,
    raw: res.data,
  };
};

/** GET /applications/:id/payment */
export const getApplicationPaymentRequest = async (applicationId: string) => {
  const res = await profile.get(
    `/applications/${encodeURIComponent(applicationId)}/payment`,
    { headers: memberHubHeaders() },
  );
  return {
    status: res.status,
    data: (unwrap(res) || {}) as ApplicationPaymentView,
    error: res.data,
  };
};
