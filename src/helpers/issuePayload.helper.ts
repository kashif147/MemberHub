/**
 * Build POST /issues payloads for MemberHub, keyed exactly to issue-service
 * controllers/issue.controller.js#createIssue + models/issue.model.js and
 * models/issue.complaint.model.js (same whitelist as ProjectShell-1 issueOptions).
 *
 * Never send server-managed / protected fields:
 * _id, tenantId, issueType (set only as discriminator selector — controller reads it
 * then stripProtectedFields removes it from the doc), internalReferenceNumber,
 * caseFileNumber, createdBy, createdOn, meta, caseTitle, complainant, owner.team,
 * createdViaPortal, lastActivityAt.
 *
 * People mapping (CRM):
 * - owner.userId     → case owner (Branch Officer / staff user id)
 * - memberIds[0]     → complainant (profile-service profileId)
 * - memberIds[1]     → related member (MOM)
 */

/** Same codes as CRM ComplaintFields / Portal CMPLNTYPE */
export const MEMBER_ON_MEMBER_CODE = 'MOM';
export const MEMBER_ON_SERVICE_PROVIDER_CODE = 'MOSP';

export const DEFAULT_ISSUE_STATUS = 'ACTIVE';
export const DEFAULT_PRIORITY = 'MEDIUM';

/** Base IssueSchema fields the create endpoint accepts from the client. */
export const ISSUE_CREATE_BASE_FIELDS = [
  'description',
  'availability',
  'issueSource',
  'issueSourceOther',
  'origin',
  'priority',
  'dateReceived',
  'memberIds',
  'groupId',
  'linkedIssueIds',
  'issueStatus',
  'issueStatusOther',
  'owner',
  'complaintAgainstUserId',
] as const;

/** COMPLAINT discriminator fields (issue.complaint.model.js). */
export const COMPLAINT_TYPE_FIELDS = [
  'complaintType',
  'externalSolicitorInvolved',
  'solicitor',
  'solicitorOther',
  'resolvedByUserId',
  'dueDate',
  'externalAgency',
  'externalCaseRef',
  'respondents',
  'serviceProvider',
] as const;

export type NewCaseFormValues = {
  description: string;
  complaintType: string;
  /** ISO date — IssueSchema.dateReceived */
  dateReceived: string;
  /** profile-service profileIds */
  memberIds: string[];
  /** ORIGIN lookup code — IssueSchema.origin */
  origin: string;
  issueStatus?: string | null;
  /** ISSUESRC lookup code */
  issueSource?: string | null;
  issueSourceOther?: string | null;
  priority?: string;
  /** Staff user id — owner.userId */
  ownerUserId: string;
  availability?: string | null;
  /** MOSP */
  serviceProvider?: string | null;
  dueDate?: string | null;
  externalAgency?: string | null;
  externalCaseRef?: string | null;
  externalSolicitorInvolved?: boolean;
  solicitor?: string | null;
  solicitorOther?: string | null;
};

export type SelectOption = { label: string; value: string };

const optionLabel = (value: string, options: SelectOption[]) => {
  const match = options.find(o => o.value === value);
  return String(match?.label || '').toLowerCase();
};

export const isMemberOnMemberComplaintType = (
  value: string,
  options: SelectOption[] = [],
) => {
  const code = String(value || '').trim().toUpperCase();
  if (code === MEMBER_ON_MEMBER_CODE) return true;
  return optionLabel(value, options).includes('member on member');
};

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

export const toDateReceivedIso = (value?: string | null): string | null => {
  const raw = String(value || '').trim();
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
};

const isEmpty = (v: unknown) =>
  v == null ||
  v === '' ||
  (Array.isArray(v) && v.length === 0);

/**
 * Pick only controller-accepted keys and drop empties so Mongoose defaults apply.
 * Always includes `issueType` so createIssue can select the discriminator model
 * (then stripProtectedFields removes it from the document body).
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

  const memberIds = Array.isArray(values.memberIds)
    ? values.memberIds.map(id => String(id).trim()).filter(Boolean)
    : [];

  if (complaintType === MEMBER_ON_MEMBER_CODE && memberIds.length === 0) {
    throw new Error(
      'A complainant (memberIds) is required when complaintType is Member On Member',
    );
  }

  if (
    complaintType === MEMBER_ON_SERVICE_PROVIDER_CODE &&
    !String(values.serviceProvider || '').trim()
  ) {
    throw new Error('serviceProvider is required when complaintType is MOSP');
  }

  const raw: Record<string, unknown> = {
    issueType: 'COMPLAINT',
    description: values.description?.trim() || null,
    availability: values.availability?.trim() || null,
    issueSource: values.issueSource?.trim() || null,
    issueSourceOther: values.issueSourceOther?.trim() || null,
    origin,
    priority: String(values.priority || '').trim() || DEFAULT_PRIORITY,
    dateReceived,
    memberIds,
    issueStatus:
      String(values.issueStatus || '').trim() || DEFAULT_ISSUE_STATUS,
    owner: { userId: ownerUserId },
    complaintType,
    serviceProvider: values.serviceProvider?.trim() || null,
    dueDate: toDateReceivedIso(values.dueDate) || null,
    externalAgency: values.externalAgency?.trim() || null,
    externalCaseRef: values.externalCaseRef?.trim() || null,
    externalSolicitorInvolved: !!values.externalSolicitorInvolved,
    solicitor: values.solicitor?.trim() || null,
    solicitorOther: values.solicitorOther?.trim() || null,
  };

  const allowed = new Set<string>([
    'issueType',
    ...ISSUE_CREATE_BASE_FIELDS,
    ...COMPLAINT_TYPE_FIELDS,
  ]);

  const payload: Record<string, unknown> = {};
  Object.keys(raw).forEach(key => {
    if (!allowed.has(key)) return;
    const v = raw[key];
    if (key === 'issueType' || key === 'owner' || key === 'memberIds') {
      payload[key] = v;
      return;
    }
    if (key === 'externalSolicitorInvolved') {
      if (v) payload[key] = true;
      return;
    }
    if (!isEmpty(v)) payload[key] = v;
  });

  return payload;
};

/** NOTE activity body for POST /issues/:id/activities (issueActivity.controller). */
export const buildNoteActivityPayload = (noteText: string) => ({
  activityType: 'NOTE',
  subject: null,
  body: String(noteText || '').trim(),
  interactionDate: new Date().toISOString(),
  pertinentToFileReview: false,
  sendNotification: true,
  visibleToMember: false,
});

export const toSelectOptions = (
  items: Array<{ code: string; displayName: string }>,
): SelectOption[] =>
  (items || []).map(i => ({
    label: i.displayName || i.code,
    value: i.code,
  }));
