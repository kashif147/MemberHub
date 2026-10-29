import type { DriveStatus, MembershipDriveRecord } from '../api/membershipDrive.api';

/** Shared membership-drive form helpers (API lives in services/membershipDrive.services). */

export const DRIVE_TYPE_OPTIONS = [
  'Workplace walkabout',
  'New graduates',
  'Stand at event',
  'Lapsed member outreach',
  'Online / remote',
] as const;

/**
 * Prototype UI status labels.
 * Paused has no API status yet — shown in the UI only.
 */
export type DriveUiStatus =
  | 'Scheduled'
  | 'Live'
  | 'Paused'
  | 'Completed'
  | 'Cancelled';

export const DRIVE_STATUS_OPTIONS: {
  ui: DriveUiStatus;
  api: DriveStatus | null;
  description: string;
}[] = [
  {
    ui: 'Scheduled',
    api: 'DRAFT',
    description:
      'Not started yet; reps can see it but not register to it',
  },
  {
    ui: 'Live',
    api: 'IN_PROGRESS',
    description:
      'Open for registrations; new applications are tagged to it',
  },
  {
    ui: 'Paused',
    api: null,
    description: 'Temporarily closed; can be resumed later',
  },
  {
    ui: 'Completed',
    api: 'COMPLETED',
    description: 'Finished; results are kept for reporting',
  },
  {
    ui: 'Cancelled',
    api: 'INACTIVE',
    description: 'Called off; a reason is required',
  },
];

/** Calendar date YYYY-MM-DD for Joi `date().iso()` / drive window. */
export const toIsoStartOfDay = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const toIsoDaysFromNow = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toIsoStartOfDay(d);
};

export const apiStatusToUi = (status?: string): DriveUiStatus => {
  switch (status) {
    case 'IN_PROGRESS':
      return 'Live';
    case 'COMPLETED':
      return 'Completed';
    case 'INACTIVE':
      return 'Cancelled';
    case 'DRAFT':
    default:
      return 'Scheduled';
  }
};

export const formatDriveStatusLabel = (status?: string) =>
  apiStatusToUi(status);

export const isOpenDrive = (status?: string) =>
  status === 'DRAFT' || status === 'IN_PROGRESS';

export const isPreviousDrive = (status?: string) =>
  status === 'COMPLETED' || status === 'INACTIVE';

export const formatDriveDateRange = (
  startDate?: string,
  endDate?: string,
): string => {
  const fmt = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    });
  };
  const start = fmt(startDate);
  const end = fmt(endDate);
  if (start && end) return `${start} – ${end}`;
  return start || end || '';
};

export const resolveWorkLocationLabels = (
  ids: string[] | undefined,
  rows: { id: string; name: string }[] = [],
): string => {
  if (!ids?.length) return '—';
  const byId = new Map(rows.map(r => [r.id, r.name]));
  const labels = ids.map(id => byId.get(id) || id).filter(Boolean);
  return labels.length ? labels.join(', ') : '—';
};

export const driveProgress = (drive: MembershipDriveRecord) => {
  const total = Number(drive.stats?.total ?? 0) || 0;
  const target =
    Number(drive.stats?.signUpTarget ?? drive.signUpTarget ?? 0) || 0;
  const rejoins = Number(drive.stats?.rejoins ?? 0) || 0;
  const pct = target > 0 ? Math.min(100, Math.round((total / target) * 100)) : 0;
  return { total, target, rejoins, pct };
};

export const formatSignupTime = (iso?: string | null) => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

export const isLinkedToday = (iso?: string | null) => {
  if (!iso) return false;
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return false;
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  } catch {
    return false;
  }
};

export const displayRegistrationName = (row: {
  fullName?: string | null;
  forename?: string | null;
  surname?: string | null;
}) =>
  String(
    row.fullName ||
      [row.forename, row.surname].filter(Boolean).join(' ') ||
      'Member',
  ).trim();
