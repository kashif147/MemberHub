/**
 * Build POST /issues payload for MemberHub "New case" (COMPLAINT),
 * mirroring ProjectShell-1 buildIssueCreatePayload for the complaint subset.
 */
export type NewCaseFormValues = {
  description: string;
  complaintType: string;
  dateReceived?: string | null;
  memberIds: string[];
  issueStatus?: string | null;
  origin?: string | null;
  issueSource?: string | null;
  priority?: string;
  /** Required by CRM issue-service for COMPLAINT create */
  ownerUserId?: string | null;
};

export const buildComplaintCreatePayload = (values: NewCaseFormValues) => {
  const payload: Record<string, any> = {
    issueType: 'COMPLAINT',
    description: values.description?.trim() || '',
    complaintType: values.complaintType || undefined,
    memberIds: Array.isArray(values.memberIds)
      ? values.memberIds.filter(Boolean)
      : [],
    priority: values.priority || 'MEDIUM',
  };

  if (values.ownerUserId) {
    payload.owner = { userId: values.ownerUserId };
  }

  if (values.dateReceived) {
    payload.dateReceived = values.dateReceived;
  }
  if (values.issueStatus) {
    payload.issueStatus = values.issueStatus;
  }
  if (values.origin) {
    payload.origin = values.origin;
  }
  if (values.issueSource) {
    payload.issueSource = values.issueSource;
  }

  return payload;
};

export const toSelectOptions = (
  items: Array<{ code: string; displayName: string }>,
) =>
  (items || []).map(i => ({
    label: i.displayName || i.code,
    value: i.code,
  }));
