import type { Member, MemberStatus } from '../data/mockMembers';

const initialsFromName = (name: string) =>
  String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';

const formatEuro = (amount: any): string | null => {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return null;
  return `€${n.toFixed(2)}`;
};

const normalizeStatus = (raw: any): MemberStatus => {
  const s = String(raw || '').trim();
  const key = s.toLowerCase();
  if (key.includes('lapse')) return 'Lapsed';
  if (key.includes('resign') || key.includes('cancel')) return 'Resigned';
  if (key === 'active' || key.includes('active')) return 'Active';
  return (s as MemberStatus) || 'Active';
};

/** Map CRM subscription filter row → Members list item. */
export const mapSubscriptionRowToMember = (row: any): Member => {
  const name =
    row?.personalDetails?.fullName ||
    row?.fullName ||
    row?.user?.userFullName ||
    'Member';
  const memberNo = String(
    row?.membershipNumber || row?.personalDetails?.membershipNo || '',
  );
  const grade =
    row?.professionalDetails?.grade || row?.grade || row?.membershipCategory || '';
  const location =
    row?.professionalDetails?.workLocation ||
    row?.workLocation ||
    row?.professionalDetails?.branch ||
    row?.branch ||
    '';
  const outstanding =
    row?.financialDetails?.outstandingBalance ?? row?.outstandingBalance;
  const arrears = formatEuro(outstanding);

  return {
    id: String(row?._id || row?.profileId || row?.applicationId || memberNo),
    initials: initialsFromName(name),
    name,
    memberNo,
    role: String(grade || '—'),
    branch: String(location || '—'),
    status: normalizeStatus(row?.subscriptionStatus || row?.membershipStatus),
    arrears,
    grade: row?.membershipCategory || grade,
    joined: row?.startDate
      ? new Date(row.startDate).toLocaleDateString('en-IE', {
          month: 'short',
          year: 'numeric',
        })
      : undefined,
  };
};

export const MEMBERS_FILTER_COLUMNS = [
  'membershipNumber',
  'personalDetails.fullName',
  'membershipCategory',
  'subscriptionStatus',
  'startDate',
  'endDate',
  'financialDetails.membershipFee',
  'financialDetails.outstandingBalance',
  'financialDetails.lastPaymentAmount',
  'financialDetails.lastPaymentDate',
  'professionalDetails.grade',
  'professionalDetails.workLocation',
  'professionalDetails.branch',
  'professionalDetails.region',
];
