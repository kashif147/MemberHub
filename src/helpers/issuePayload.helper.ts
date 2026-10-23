/**
 * Build POST /issues payload for MemberHub "New case" (COMPLAINT),
 * mirroring ProjectShell-1 CreateCasesDrawer / issueOptions.buildIssueCreatePayload
 * and issue-service models/issue.model.js (+ complaint discriminator).
 *
 * Client-settable fields only — never send server-managed:
 * tenantId, internalReferenceNumber, caseTitle, createdBy, createdOn,
 * createdViaPortal, lastActivityAt, meta, complainant, owner.team.
 *
 * People mapping (CRM issue-service):
 * - owner.userId     → case creator / owner (Branch Officer)
 * - memberIds[0]     → complainant
 * - memberIds[1]     → related member (person the complaint is about)
 */

/** Same codes as ProjectShell ComplaintFields / Portal COMPLAINT_TYPE */
export const MEMBER_ON_MEMBER_CODE = 'MOM';
export const MEMBER_ON_SERVICE_PROVIDER_CODE = 'MOSP';

/** Schema default for issueStatus when lookup is unavailable */
export const DEFAULT_ISSUE_STATUS = 'ACTIVE';

/** Schema default for priority */
export const DEFAULT_PRIORITY = 'MEDIUM';

export type NewCaseFormValues = {
  description: string;
  complaintType: string;
  /** ISO date string — required by IssueSchema.dateReceived */
  dateReceived: string;
  memberIds: string[];
  /** Lookup ORIGIN code — required by IssueSchema.origin */
  origin: string;
  issueStatus?: string | null;
  issueSource?: string | null;
  priority?: string;
  /** Required by CRM issue-service for COMPLAINT (ownerRequiredExceptIr) */
  ownerUserId: string;
  /** MOSP — CRM ComplaintFields.serviceProvider */
  serviceProvider?: string | null;
};

export type SelectOption = { label: string; value: string };

const optionLabel = (value: string, options: SelectOption[]) => {
  const match = options.find(o => o.value === value);
  return String(match?.label || '').toLowerCase();
};

/**
 * Member On Member (MOM) — CRM shows Complainant + Related Member fields.
 */
export const isMemberOnMemberComplaintType = (
  value: string,
  options: SelectOption[] = [],
) => {
  const code = String(value || '').trim().toUpperCase();
  if (code === MEMBER_ON_MEMBER_CODE) return true;
  return optionLabel(value, options).includes('member on member');
};

/**
 * Member On Service Provider (MOSP) — CRM shows Service Provider field.
 */
export const isMemberOnServiceProviderComplaintType = (
  value: string,
  options: SelectOption[] = [],
) => {
  const code = String(value || '').trim().toUpperCase();
  if (code === MEMBER_ON_SERVICE_PROVIDER_CODE) return true;
  const label = optionLabel(value, options);
  return (
    label.includes('member on service provider') ||
    label.includes('service provider')
  );
};

/**
 * Ordered memberIds like CreateCasesDrawer:
 * complainant → index 0, related member → index 1 (if present).
 */
export const buildOrderedMemberIds = (args: {
  complainantId?: string | null;
  relatedMemberId?: string | null;
}): string[] => {
  const complainant = String(args.complainantId || '').trim();
  const related = String(args.relatedMemberId || '').trim();
  if (!complainant && !related) return [];
  if (!complainant) return related ? [related] : [];
  if (!related || related === complainant) return [complainant];
  return [complainant, related];
};

/** Normalize dateReceived to an ISO string accepted by Mongoose Date. */
export const toDateReceivedIso = (value?: string | null): string | null => {
  const raw = String(value || '').trim();
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
};

/**
 * POST /issues body aligned with IssueSchema + COMPLAINT discriminator fields.
 * Omits null/empty optional fields so the API applies schema defaults.
 */
export const buildComplaintCreatePayload = (values: NewCaseFormValues) => {
  const dateReceived = toDateReceivedIso(values.dateReceived);
  if (!dateReceived) {
    throw new Error('dateReceived is required');
  }
  const origin = String(values.origin || '').trim();
  if (!origin) {
    throw new Error('origin is required');
  }
  const ownerUserId = String(values.ownerUserId || '').trim();
  if (!ownerUserId) {
    throw new Error('owner.userId is required');
  }
  const complaintType = String(values.complaintType || '').trim();
  if (!complaintType) {
    throw new Error('complaintType is required');
  }

  const payload: Record<string, unknown> = {
    issueType: 'COMPLAINT',
    issueStatus: String(values.issueStatus || '').trim() || DEFAULT_ISSUE_STATUS,
    dateReceived,
    origin,
    description: values.description?.trim() || null,
    memberIds: Array.isArray(values.memberIds)
      ? values.memberIds.map(id => String(id).trim()).filter(Boolean)
      : [],
    owner: { userId: ownerUserId },
    priority: String(values.priority || '').trim() || DEFAULT_PRIORITY,
    complaintType,
  };

  if (values.issueSource?.trim()) {
    payload.issueSource = values.issueSource.trim();
  }
  if (values.serviceProvider?.trim()) {
    payload.serviceProvider = values.serviceProvider.trim();
  }

  return payload;
};

export const toSelectOptions = (
  items: Array<{ code: string; displayName: string }>,
): SelectOption[] =>
  (items || []).map(i => ({
    label: i.displayName || i.code,
    value: i.code,
  }));
