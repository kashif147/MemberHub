import {
  getApplicationPaymentRequest,
  makePaymentLinkIdempotencyKey,
  requestApplicationPaymentLinkRequest,
  type ApplicationPaymentView,
  type PaymentLinkAction,
  type PaymentOption,
} from '../api/applicationPaymentLink.api';

const apiError = (res: any, fallback: string) => {
  const msg =
    res?.error?.error?.message ||
    res?.error?.message ||
    res?.raw?.error?.message ||
    res?.data?.error?.message ||
    res?.data?.message ||
    fallback;
  return new Error(typeof msg === 'string' ? msg : fallback);
};

export type { ApplicationPaymentView, PaymentLinkAction, PaymentOption };

export const paymentStatusLabel = (status?: string) => {
  switch (String(status || '').toUpperCase()) {
    case 'NONE':
      return 'No payment yet';
    case 'LINK_REQUESTED':
      return 'Link requested…';
    case 'LINK_ISSUED':
      return 'Link sent';
    case 'LINK_EXPIRED':
      return 'Link expired';
    case 'AUTHORISED':
    case 'AUTHORISATION_EXPIRING':
      return 'Payment authorised';
    case 'CAPTURED':
      return 'Payment captured';
    case 'FAILED':
      return 'Payment failed';
    case 'CANCELED':
      return 'Canceled';
    case 'REFUNDED':
    case 'PARTIALLY_REFUNDED':
      return 'Refunded';
    default:
      return status || 'Unknown';
  }
};

export const isActivePaymentLink = (status?: string) =>
  ['LINK_REQUESTED', 'LINK_ISSUED'].includes(String(status || '').toUpperCase());

export const isAuthorisedOrLater = (status?: string) =>
  [
    'AUTHORISED',
    'AUTHORISATION_EXPIRING',
    'CAPTURED',
    'REFUNDED',
    'PARTIALLY_REFUNDED',
  ].includes(String(status || '').toUpperCase());

export const fetchApplicationPayment = async (
  applicationId: string,
): Promise<ApplicationPaymentView> => {
  if (!applicationId) throw new Error('Missing application id');
  const res = await getApplicationPaymentRequest(applicationId);
  if (!(res.status >= 200 && res.status < 300)) {
    throw apiError(res, 'Failed to load payment status');
  }
  return res.data || { status: 'NONE' };
};

/**
 * ISSUE / RESEND / REPLACE payment link for an application.
 * Server derives paymentOption from subscription payment type.
 */
export const requestApplicationPaymentLink = async (
  applicationId: string,
  action: PaymentLinkAction,
  opts?: { paymentOption?: PaymentOption; idempotencyKey?: string },
) => {
  if (!applicationId) throw new Error('Missing application id');
  const key =
    opts?.idempotencyKey ||
    makePaymentLinkIdempotencyKey(`${action}-${applicationId.slice(-6)}`);
  const body: { action: PaymentLinkAction; paymentOption?: PaymentOption } = {
    action,
  };
  if (opts?.paymentOption && action !== 'RESEND') {
    body.paymentOption = opts.paymentOption;
  }
  const res = await requestApplicationPaymentLinkRequest(
    applicationId,
    body,
    key,
  );
  // Controller returns 202 for accepted ISSUE/RESEND/REPLACE.
  if (!(res.status >= 200 && res.status < 300)) {
    throw apiError(res, `Could not ${action.toLowerCase()} payment link`);
  }
  return {
    applicationId: res.data?.applicationId || applicationId,
    linkVersion: Number(res.data?.linkVersion) || 0,
    payment: res.data?.payment || { status: 'LINK_REQUESTED' },
    statusCode: res.status,
  };
};

/** Poll GET payment until status leaves LINK_REQUESTED or attempts exhausted. */
export const waitForPaymentLinkIssued = async (
  applicationId: string,
  {
    attempts = 8,
    intervalMs = 1500,
  }: { attempts?: number; intervalMs?: number } = {},
): Promise<ApplicationPaymentView> => {
  let last: ApplicationPaymentView = { status: 'LINK_REQUESTED' };
  for (let i = 0; i < attempts; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    last = await fetchApplicationPayment(applicationId);
    const s = String(last.status || '').toUpperCase();
    if (s !== 'LINK_REQUESTED' && s !== 'NONE') return last;
    // eslint-disable-next-line no-await-in-loop
    await new Promise(r => setTimeout(r, intervalMs));
  }
  return last;
};
