import { PROFILE_SERVICE_URL } from '../constants/config';
import { createAuthedClient } from './createClient';

/**
 * CRM ApplicationMgtDrawer / Portal application CRUD against profile-service.
 * Paths match ProjectShell-1 PROFILE_SERVICE_URL (already ends with /api).
 */
const profile = createAuthedClient(PROFILE_SERVICE_URL);

export const createPersonalDetailRequest = (data: Record<string, any>) =>
  profile.post('/personal-details', data);

export const updatePersonalDetailRequest = (
  id: string,
  data: Record<string, any>,
) => profile.put(`/personal-details/${id}`, data);

export const checkPersonalEmailRequest = (data: { email: string }) =>
  profile.post('/personal-details/check-email', data);

export const createProfessionalDetailRequest = (
  id: string,
  data: Record<string, any>,
) => profile.post(`/professional-details/${id}`, data);

export const updateProfessionalDetailRequest = (
  id: string,
  data: Record<string, any>,
) => profile.put(`/professional-details/${id}`, data);

export const createSubscriptionDetailRequest = (
  id: string,
  data: Record<string, any>,
) => profile.post(`/subscription-details/${id}`, data);

export const updateSubscriptionDetailRequest = (
  id: string,
  data: Record<string, any>,
) => profile.put(`/subscription-details/${id}`, data);
