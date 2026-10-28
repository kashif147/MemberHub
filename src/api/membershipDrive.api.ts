import { PROFILE_SERVICE_URL } from '../constants/config';
import { createAuthedClient } from './createClient';

/**
 * Membership drives — profile-service `/membership-drives`.
 * Base URL already ends with `/api`.
 */
const profile = createAuthedClient(PROFILE_SERVICE_URL);

const unwrap = (res: any) => res?.data?.data ?? res?.data;

export type DriveStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'INACTIVE';

export type MembershipDriveStats = {
  today: number;
  total: number;
  rejoins: number;
  signUpTarget: number;
  remainingToTarget: number;
  timeZone?: string;
};

export type MembershipDriveRecord = {
  _id: string;
  id?: string;
  name: string;
  driveType: string;
  workLocations: string[];
  startDate: string;
  endDate: string;
  signUpTarget?: number;
  notes?: string | null;
  status: DriveStatus;
  statusChangedAt?: string | null;
  ownerUserId?: string;
  createdAt?: string;
  updatedAt?: string;
  stats?: MembershipDriveStats;
};

export type DriveRegistration = {
  applicationId: string;
  applicationStatus?: string | null;
  forename?: string | null;
  surname?: string | null;
  fullName?: string | null;
  applicationCreatedAt?: string | null;
  linkedAt?: string | null;
  linkedBy?: string | null;
  late?: boolean;
  isRejoin?: boolean;
  profileId?: string | null;
  membershipNumber?: string | null;
};

export type CreateMembershipDriveBody = {
  name: string;
  driveType: string;
  workLocations: string[];
  startDate: string;
  endDate: string;
  signUpTarget?: number;
  notes?: string | null;
};

export const listMembershipDrivesRequest = async (params?: {
  status?: DriveStatus;
  page?: number;
  limit?: number;
  includeStats?: boolean;
}) => {
  const res = await profile.get('/membership-drives', { params });
  return { status: res.status, data: unwrap(res), error: res.data };
};

export const createMembershipDriveRequest = async (
  body: CreateMembershipDriveBody,
) => {
  const res = await profile.post('/membership-drives', body);
  return { status: res.status, data: unwrap(res), error: res.data };
};

export const getMembershipDriveRequest = async (id: string) => {
  const res = await profile.get(`/membership-drives/${id}`);
  return { status: res.status, data: unwrap(res), error: res.data };
};

export const changeMembershipDriveStatusRequest = async (
  id: string,
  status: DriveStatus,
) => {
  const res = await profile.patch(`/membership-drives/${id}/status`, {
    status,
  });
  return { status: res.status, data: unwrap(res), error: res.data };
};

export const getMembershipDriveStatsRequest = async (id: string) => {
  const res = await profile.get(`/membership-drives/${id}/stats`);
  return { status: res.status, data: unwrap(res), error: res.data };
};

export const listDriveRegistrationsRequest = async (
  id: string,
  params?: { page?: number; limit?: number; applicationStatus?: string },
) => {
  const res = await profile.get(`/membership-drives/${id}/registrations`, {
    params,
  });
  return { status: res.status, data: unwrap(res), error: res.data };
};

export const linkDriveRegistrationRequest = async (
  driveId: string,
  applicationId: string,
) => {
  const res = await profile.post(`/membership-drives/${driveId}/registrations`, {
    applicationId,
  });
  return { status: res.status, data: unwrap(res), error: res.data };
};
