import { createAuthedClient } from './createClient';
import { SUBSCRIPTION_SERVICE_URL } from '../constants/config';

const subscription = createAuthedClient(SUBSCRIPTION_SERVICE_URL);

export type SubscriptionFilterClause = {
  operator: string;
  values: string[];
};

export type SubscriptionFilterPayload = {
  templateId?: string;
  page?: number;
  limit?: number;
  filters?: Record<string, SubscriptionFilterClause>;
  columns?: string[];
};

/** CRM Members grid — PUT /subscriptions/filter */
export const filterSubscriptionsRequest = (payload: SubscriptionFilterPayload) =>
  subscription.put('/subscriptions/filter', payload);
