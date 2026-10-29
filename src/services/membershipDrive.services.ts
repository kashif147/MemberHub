import {
  changeMembershipDriveStatusRequest,
  createMembershipDriveRequest,
  getMembershipDriveRequest,
  getMembershipDriveStatsRequest,
  linkDriveRegistrationRequest,
  listDriveRegistrationsRequest,
  listMembershipDrivesRequest,
  type CreateMembershipDriveBody,
  type DriveRegistration,
  type DriveStatus,
  type MembershipDriveRecord,
  type MembershipDriveStats,
} from '../api/membershipDrive.api';
import { isOpenDrive } from '../helpers/membershipDrive.helper';

const apiError = (res: any, fallback: string) => {
  const msg =
    res?.error?.error?.message ||
    res?.error?.message ||
    res?.data?.error?.message ||
    res?.data?.message ||
    fallback;
  return new Error(typeof msg === 'string' ? msg : fallback);
};

const normalizeDrive = (raw: any): MembershipDriveRecord | null => {
  if (!raw || typeof raw !== 'object') return null;
  const id = String(raw._id || raw.id || '').trim();
  if (!id) return null;
  return {
    ...raw,
    _id: id,
    id,
    name: String(raw.name || '').trim(),
    driveType: String(raw.driveType || '').trim(),
    workLocations: Array.isArray(raw.workLocations)
      ? raw.workLocations.map((v: any) => String(v).trim()).filter(Boolean)
      : [],
    startDate: raw.startDate,
    endDate: raw.endDate,
    status: (raw.status || 'DRAFT') as DriveStatus,
    stats: raw.stats,
  };
};

/** List the signed-in officer's drives (excludes INACTIVE by default). */
export const fetchMyMembershipDrives = async (options?: {
  includeStats?: boolean;
  status?: DriveStatus;
  limit?: number;
}): Promise<{ drives: MembershipDriveRecord[]; total: number }> => {
  const res = await listMembershipDrivesRequest({
    includeStats: options?.includeStats ?? true,
    status: options?.status,
    page: 1,
    limit: options?.limit ?? 50,
  });

  if (!(res.status >= 200 && res.status < 300)) {
    throw apiError(res, 'Failed to load membership drives');
  }

  const body = res.data || {};
  const rows = Array.isArray(body.drives)
    ? body.drives
    : Array.isArray(body)
      ? body
      : [];

  return {
    drives: rows.map(normalizeDrive).filter(Boolean) as MembershipDriveRecord[],
    total: Number(body.total ?? rows.length) || 0,
  };
};

/** Create a drive as DRAFT (Scheduled in the app). */
export const createMembershipDrive = async (
  payload: CreateMembershipDriveBody,
): Promise<MembershipDriveRecord> => {
  const createRes = await createMembershipDriveRequest(payload);
  if (!(createRes.status >= 200 && createRes.status < 300)) {
    throw apiError(createRes, 'Could not create this drive');
  }
  const created = normalizeDrive(createRes.data);
  if (!created) {
    throw new Error('Drive created but response was empty');
  }
  return created;
};

/** Create a drive, then start it so applications can be attributed. */
export const createAndStartMembershipDrive = async (
  payload: CreateMembershipDriveBody,
): Promise<MembershipDriveRecord> => {
  const created = await createMembershipDrive(payload);

  // DRAFT cannot accept registrations — move to IN_PROGRESS for the hub flow.
  const startRes = await changeMembershipDriveStatusRequest(
    created._id,
    'IN_PROGRESS',
  );
  if (startRes.status >= 200 && startRes.status < 300) {
    return normalizeDrive(startRes.data) || { ...created, status: 'IN_PROGRESS' };
  }

  // Still return the draft if start failed (e.g. permissions); hub can retry.
  return created;
};

export const fetchMembershipDrive = async (
  driveId: string,
): Promise<MembershipDriveRecord> => {
  const res = await getMembershipDriveRequest(driveId);
  if (!(res.status >= 200 && res.status < 300)) {
    throw apiError(res, 'Failed to load drive');
  }
  const drive = normalizeDrive(res.data);
  if (!drive) throw new Error('Drive not found');
  return drive;
};

export const fetchMembershipDriveStats = async (
  driveId: string,
): Promise<MembershipDriveStats> => {
  const res = await getMembershipDriveStatsRequest(driveId);
  if (!(res.status >= 200 && res.status < 300)) {
    throw apiError(res, 'Failed to load drive stats');
  }
  const raw = res.data || {};
  return {
    today: Number(raw.today) || 0,
    total: Number(raw.total) || 0,
    rejoins: Number(raw.rejoins) || 0,
    signUpTarget: Number(raw.signUpTarget) || 0,
    remainingToTarget: Number(raw.remainingToTarget) || 0,
    timeZone: raw.timeZone,
  };
};

export const updateMembershipDriveStatus = async (
  driveId: string,
  status: DriveStatus,
): Promise<MembershipDriveRecord> => {
  const res = await changeMembershipDriveStatusRequest(driveId, status);
  if (!(res.status >= 200 && res.status < 300)) {
    throw apiError(res, 'Could not update drive status');
  }
  const drive = normalizeDrive(res.data);
  if (!drive) throw new Error('Drive update returned empty');
  return drive;
};

/** Open (Scheduled + Live) and previous (Completed + Cancelled) lists. */
export const fetchMyDrivesGrouped = async (): Promise<{
  open: MembershipDriveRecord[];
  previous: MembershipDriveRecord[];
  liveCount: number;
}> => {
  const [{ drives }, inactive] = await Promise.all([
    fetchMyMembershipDrives({ includeStats: true, limit: 50 }),
    fetchMyMembershipDrives({
      includeStats: true,
      status: 'INACTIVE',
      limit: 50,
    }).catch(() => ({ drives: [] as MembershipDriveRecord[], total: 0 })),
  ]);

  const open = drives.filter(d => isOpenDrive(d.status));
  const previous = [
    ...drives.filter(d => d.status === 'COMPLETED'),
    ...inactive.drives,
  ];
  const liveCount = open.filter(d => d.status === 'IN_PROGRESS').length;
  return { open, previous, liveCount };
};

export const ensureDriveAcceptingRegistrations = async (
  drive: MembershipDriveRecord,
): Promise<MembershipDriveRecord> => {
  if (drive.status === 'IN_PROGRESS' || drive.status === 'COMPLETED') {
    return drive;
  }
  if (drive.status !== 'DRAFT') {
    throw new Error('This drive is closed and cannot take new applications');
  }
  const res = await changeMembershipDriveStatusRequest(drive._id, 'IN_PROGRESS');
  if (!(res.status >= 200 && res.status < 300)) {
    throw apiError(res, 'Could not start this drive');
  }
  return normalizeDrive(res.data) || { ...drive, status: 'IN_PROGRESS' };
};

export const fetchDriveRegistrations = async (
  driveId: string,
  limit = 20,
): Promise<DriveRegistration[]> => {
  const res = await listDriveRegistrationsRequest(driveId, {
    page: 1,
    limit,
  });
  if (!(res.status >= 200 && res.status < 300)) {
    throw apiError(res, 'Failed to load drive sign-ups');
  }
  const body = res.data || {};
  return Array.isArray(body.registrations) ? body.registrations : [];
};

export const linkApplicationToDrive = async (
  driveId: string,
  applicationId: string,
): Promise<void> => {
  if (!driveId || !applicationId) return;
  const res = await linkDriveRegistrationRequest(driveId, applicationId);
  if (!(res.status >= 200 && res.status < 300)) {
    throw apiError(res, 'Could not tag application to this drive');
  }
};

export type { MembershipDriveRecord, MembershipDriveStats, DriveRegistration };
