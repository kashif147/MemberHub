/** Shared membership-drive form helpers (API lives in services/membershipDrive.services). */

export const DRIVE_TYPE_OPTIONS = [
  'Workplace walkabout',
  'New graduates',
  'Stand at event',
  'Lapsed member outreach',
  'Online / remote',
] as const;

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

export const formatDriveStatusLabel = (status?: string) => {
  switch (status) {
    case 'IN_PROGRESS':
      return 'In progress';
    case 'DRAFT':
      return 'Draft';
    case 'COMPLETED':
      return 'Completed';
    case 'INACTIVE':
      return 'Inactive';
    default:
      return status || '';
  }
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
