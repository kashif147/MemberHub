import type { CaseItem, CaseStatus } from '../data/mockCases';

/** CRM SCREAMING_SNAKE → Title Case (same idea as ProjectShell TableColumnsContext). */
export const formatIssueEnumLabel = (value?: string | null) => {
  if (!value) return '';
  return String(value)
    .split(/[_-]+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
};

/** Map CRM issueStatus codes onto Figma Cases tabs. */
export const mapIssueStatusToUi = (issueStatus?: string | null): CaseStatus => {
  const s = String(issueStatus || '').toUpperCase();
  if (s === 'CLOSED') return 'Closed';
  if (
    s.startsWith('PENDING') ||
    s.startsWith('AWAITING') ||
    s.startsWith('FOR_REVIEW') ||
    s.includes('IN_PROGRESS') ||
    s.includes('INQUIRY') ||
    s.includes('BEFORE_BOARD') ||
    s.includes('PPC')
  ) {
    return 'In progress';
  }
  return 'Open';
};

export const formatCaseDate = (raw?: string | null) => {
  if (!raw) return '—';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const formatCaseDateTime = (raw?: string | null) => {
  if (!raw) return '—';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const displayValue = (value?: any) => {
  if (value == null || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
};

const stripHtml = (html?: string) =>
  String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const categoryFromIssue = (iss: any) => {
  const complaint = iss?.complaintType || iss?.complaint?.complaintType;
  if (complaint) {
    return formatIssueEnumLabel(complaint).toUpperCase();
  }
  const typeLabels: Record<string, string> = {
    COMPLAINT: 'COMPLAINT',
    FTP: 'FITNESS TO PRACTICE',
    IR: 'INDUSTRIAL RELATIONS',
    DP: 'DATA PROTECTION',
  };
  const t = String(iss?.issueType || '');
  return typeLabels[t] || formatIssueEnumLabel(t).toUpperCase() || 'CASE';
};

const titleFromIssue = (iss: any) => {
  const ref = String(
    iss?.internalReferenceNumber || iss?.caseFileNumber || '',
  ).trim();
  const title = String(iss?.caseTitle || '').trim();
  // Avoid showing the reference twice when caseTitle mirrors internalReferenceNumber
  if (title && title !== ref) return title;
  const desc = stripHtml(iss?.description);
  if (desc) {
    return desc.length > 80 ? `${desc.slice(0, 77)}…` : desc;
  }
  return title || ref || 'Untitled case';
};

const memberFromIssue = (iss: any) => {
  const complainant = String(iss?.complainant || '').trim();
  const ref = String(
    iss?.internalReferenceNumber || iss?.caseFileNumber || '',
  ).trim();
  if (complainant && complainant !== ref) return complainant;
  const name = String(iss?.memberName || '').trim();
  if (name && name !== ref) return name;
  return '—';
};

export type CaseDetailModel = {
  id: string;
  caseTitle: string;
  internalReferenceNumber: string;
  description: string;
  issueType: string;
  issueTypeLabel: string;
  complaintType: string;
  complaintTypeLabel: string;
  issueStatus: string;
  issueStatusUi: CaseStatus;
  priority: string;
  priorityLabel: string;
  origin: string;
  issueSource: string;
  complainant: string;
  ownerTeam: string;
  ownerUserId: string;
  dateReceived: string;
  createdOn: string;
  updatedAt: string;
  dateResolved: string;
  availability: string;
  memberIds: string[];
  raw: any;
};

export const mapIssueToDetail = (iss: any): CaseDetailModel | null => {
  if (!iss) return null;
  const id = String(iss?._id || iss?.id || '');
  if (!id) return null;
  const complaintType = String(
    iss?.complaintType || iss?.complaint?.complaintType || '',
  );
  const issueType = String(iss?.issueType || '');
  const typeLabels: Record<string, string> = {
    COMPLAINT: 'Complaint',
    FTP: 'Fitness to Practice',
    IR: 'Industrial Relations',
    DP: 'Data Protection',
  };

  return {
    id,
    caseTitle: titleFromIssue(iss),
    internalReferenceNumber: String(
      iss?.internalReferenceNumber || iss?.caseFileNumber || '—',
    ),
    description: stripHtml(iss?.description) || '—',
    issueType,
    issueTypeLabel: typeLabels[issueType] || formatIssueEnumLabel(issueType) || '—',
    complaintType,
    complaintTypeLabel: formatIssueEnumLabel(complaintType) || '—',
    issueStatus: String(iss?.issueStatus || ''),
    issueStatusUi: mapIssueStatusToUi(iss?.issueStatus),
    priority: String(iss?.priority || ''),
    priorityLabel: formatIssueEnumLabel(iss?.priority) || '—',
    origin: formatIssueEnumLabel(iss?.origin) || displayValue(iss?.origin),
    issueSource:
      formatIssueEnumLabel(iss?.issueSource) || displayValue(iss?.issueSource),
    complainant: memberFromIssue(iss),
    ownerTeam: displayValue(iss?.owner?.team),
    ownerUserId: displayValue(iss?.owner?.userId),
    dateReceived: formatCaseDate(iss?.dateReceived),
    createdOn: formatCaseDateTime(iss?.createdOn || iss?.createdAt),
    updatedAt: formatCaseDateTime(iss?.updatedAt),
    dateResolved: formatCaseDate(iss?.dateResolved),
    availability: stripHtml(iss?.availability) || '—',
    memberIds: Array.isArray(iss?.memberIds)
      ? iss.memberIds.map(String)
      : [],
    raw: iss,
  };
};

/**
 * Map issue-service GET /issues row → MemberHub Cases card
 * (same source as ProjectShell-1 CasesSummary).
 */
export const mapIssueToCaseItem = (iss: any): CaseItem => {
  const id = String(iss?._id || iss?.id || '');
  const caseNo =
    String(
      iss?.internalReferenceNumber ||
        iss?.caseFileNumber ||
        (id ? `CS-${id.slice(-5).toUpperCase()}` : ''),
    ).trim() || '—';

  return {
    id,
    category: categoryFromIssue(iss),
    title: titleFromIssue(iss),
    caseNo,
    member: memberFromIssue(iss),
    memberId:
      Array.isArray(iss?.memberIds) && iss.memberIds[0]
        ? String(iss.memberIds[0])
        : undefined,
    date: formatCaseDate(iss?.dateReceived || iss?.createdAt || iss?.createdOn),
    status: mapIssueStatusToUi(iss?.issueStatus),
  };
};
