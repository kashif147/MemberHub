/** Portal_App paymentIntent.helper — application subscription outcomes */

export const APPLICATION_PAYMENT_AUTHORISED_MESSAGE =
  'Your payment has been authorised successfully. Your application is now pending review. The payment will only be completed if your application is approved.';

export const extractClientSecretFromResponse = (response: any): string | null => {
  const payload = response?.data?.data ?? response?.data ?? response;
  return (
    payload?.clientSecret ||
    payload?.client_secret ||
    payload?.paymentIntent?.clientSecret ||
    payload?.paymentIntent?.client_secret ||
    payload?.data?.clientSecret ||
    payload?.data?.client_secret ||
    null
  );
};

/**
 * Normalizes Stripe PaymentIntent statuses from both platforms:
 * - Web (stripe.js): snake_case e.g. "requires_capture"
 * - Mobile (@stripe/stripe-react-native): PascalCase e.g. "RequiresCapture"
 */
export const normalizePaymentIntentStatus = (status: any): string => {
  const raw = String(status || '').trim();
  if (!raw) return '';

  if (raw.includes('_') || raw === raw.toLowerCase()) {
    return raw.toLowerCase().replace(/\s+/g, '_');
  }

  return raw
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/\s+/g, '_')
    .toLowerCase();
};

export const getPaymentIntentMemberLabel = (status: any): string => {
  const normalized = normalizePaymentIntentStatus(status);
  const labels: Record<string, string> = {
    requires_capture: 'Payment authorised',
    succeeded: 'Payment completed',
    canceled: 'Payment cancelled',
    cancelled: 'Payment cancelled',
    payment_failed: 'Payment failed',
    requires_action: 'Authentication required',
    authorisation_expired: 'Payment authorisation expired',
    requires_payment_method: 'Payment failed',
    processing: 'Payment processing',
  };
  return labels[normalized] || 'Payment status unknown';
};

export const getPaymentIntentMemberMessage = (
  status: any,
  { isApplicationPayment = false }: { isApplicationPayment?: boolean } = {},
): string => {
  const normalized = normalizePaymentIntentStatus(status);

  if (isApplicationPayment) {
    switch (normalized) {
      case 'requires_capture':
        return APPLICATION_PAYMENT_AUTHORISED_MESSAGE;
      case 'succeeded':
        return 'Payment completed. Your application has been approved and processed.';
      case 'canceled':
      case 'cancelled':
        return 'Payment authorisation was cancelled or expired.';
      case 'requires_payment_method':
      case 'payment_failed':
        return 'Payment failed. Please try again.';
      case 'requires_action':
        return 'Additional card authentication is required. Please complete authentication to continue.';
      case 'processing':
        return 'Payment is being processed. Please check back later.';
      case 'authorisation_expired':
        return 'Payment authorisation expired. Please submit a new application and authorise a new payment.';
      default:
        return 'Unable to confirm payment status. Please try again or contact support.';
    }
  }

  switch (normalized) {
    case 'requires_capture':
      return 'Your payment has been authorised successfully.';
    case 'succeeded':
      return 'Your payment has been completed successfully.';
    case 'canceled':
    case 'cancelled':
      return 'Payment authorisation was cancelled or expired.';
    case 'requires_payment_method':
    case 'payment_failed':
      return 'Payment failed. Please try again.';
    case 'requires_action':
      return 'Additional card authentication is required.';
    case 'processing':
      return 'Payment is being processed. Please check back later.';
    case 'authorisation_expired':
      return 'Payment authorisation expired. Please try again.';
    default:
      return 'Unable to confirm payment status. Please try again.';
  }
};

export const isPaymentIntentAuthorised = (status: any): boolean => {
  const normalized = normalizePaymentIntentStatus(status);
  return normalized === 'requires_capture' || normalized === 'succeeded';
};

export type PaymentIntentOutcome = {
  success: boolean;
  outcome: string;
  title: string;
  message: string;
  label: string;
  paymentIntentStatus: string;
};

export const resolvePaymentIntentOutcome = (
  status: any,
  { isApplicationPayment = false }: { isApplicationPayment?: boolean } = {},
): PaymentIntentOutcome => {
  const normalized = normalizePaymentIntentStatus(status);

  if (isPaymentIntentAuthorised(normalized)) {
    const isAuthorisedOnly = normalized === 'requires_capture';
    return {
      success: true,
      outcome: isAuthorisedOnly ? 'authorised' : 'completed',
      title:
        isApplicationPayment && isAuthorisedOnly
          ? 'Payment authorised'
          : isApplicationPayment
            ? 'Payment completed'
            : 'Payment successful',
      message: getPaymentIntentMemberMessage(normalized, {
        isApplicationPayment,
      }),
      label: getPaymentIntentMemberLabel(normalized),
      paymentIntentStatus: normalized,
    };
  }

  if (normalized === 'requires_action') {
    return {
      success: false,
      outcome: 'requires_action',
      title: 'Authentication required',
      message: getPaymentIntentMemberMessage(normalized, {
        isApplicationPayment,
      }),
      label: getPaymentIntentMemberLabel(normalized),
      paymentIntentStatus: normalized,
    };
  }

  if (normalized === 'processing') {
    return {
      success: false,
      outcome: 'processing',
      title: 'Payment processing',
      message: getPaymentIntentMemberMessage(normalized, {
        isApplicationPayment,
      }),
      label: getPaymentIntentMemberLabel(normalized),
      paymentIntentStatus: normalized,
    };
  }

  return {
    success: false,
    outcome: 'failed',
    title: 'Payment failed',
    message: getPaymentIntentMemberMessage(normalized, {
      isApplicationPayment,
    }),
    label: getPaymentIntentMemberLabel(normalized),
    paymentIntentStatus: normalized,
  };
};
