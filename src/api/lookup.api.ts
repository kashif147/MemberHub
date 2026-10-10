import { POLICY_SERVICE_URL } from '../constants/config';
import { createAuthedClient } from './createClient';

const policy = createAuthedClient(POLICY_SERVICE_URL);

export const fetchAllLookupRequest = () => policy.get('/lookup');

export const fetchLookupById = (id: string) => policy.get(`/lookup/${id}`);

/** CRM uses format=simple so each work location includes nested branch/region. */
export const fetchLookupHierarchyByType = (
  typeId: string,
  params?: { format?: string },
) =>
  policy.get(`/lookup/by-type/${typeId}/hierarchy`, {
    params: params || { format: 'simple' },
  });

export const fetchAllCountry = () => policy.get('/countries');
