import {
  createIssueRequest,
  fetchIssueActivitiesRequest,
  fetchIssueAttachmentsRequest,
  fetchIssueByIdRequest,
  fetchIssueDropdownLookupsRequest,
  fetchIssueHistoryRequest,
  fetchIssuesRequest,
  fetchIssueStatusesRequest,
  uploadIssueAttachmentRequest,
} from '../api/issues.api';
import {
  formatCaseDateTime,
  mapIssueToCaseItem,
  mapIssueToDetail,
  type CaseDetailModel,
} from '../helpers/cases.helper';
import {
  buildComplaintCreatePayload,
  type NewCaseFormValues,
} from '../helpers/issuePayload.helper';
import type { CaseItem } from '../data/mockCases';

export type PendingAttachment = {
  uri: string;
  name: string;
  type: string;
};

const assertOk = (res: { status: number; error?: any }, fallback: string) => {
  if (res.status >= 200 && res.status < 300) return;
  const msg =
    res?.error?.error?.message ||
    res?.error?.message ||
    res?.error?.data?.message ||
    fallback;
  throw new Error(typeof msg === 'string' ? msg : fallback);
};

export const loadCaseLookups = async () => {
  const res = await fetchIssueDropdownLookupsRequest();
  assertOk(res, 'Failed to load case lookups');
  return res.data;
};

/**
 * Load all issues from CRM issue-service GET /issues
 * (same as ProjectShell-1 CasesSummary / IssuesManagementDashboard).
 */
export const loadCasesList = async (): Promise<CaseItem[]> => {
  const res = await fetchIssuesRequest();
  assertOk(res, 'Failed to load cases');
  return (res.data || [])
    .map(mapIssueToCaseItem)
    .filter(c => Boolean(c.id));
};

export type CaseActivityItem = {
  id: string;
  body: string;
  activityType: string;
  createdAt: string;
  createdBy: string;
};

export type CaseHistoryItem = {
  id: string;
  summary: string;
  action: string;
  createdAt: string;
  actor: string;
};

export type CaseAttachmentItem = {
  id: string;
  name: string;
  createdAt: string;
};

export type CaseDetailBundle = {
  issue: CaseDetailModel;
  activities: CaseActivityItem[];
  history: CaseHistoryItem[];
  attachments: CaseAttachmentItem[];
};

/**
 * Load one issue + activities/history/attachments
 * (CRM CasesDetails / Portal CaseDetail data sources).
 */
export const loadCaseDetail = async (
  issueId: string,
): Promise<CaseDetailBundle> => {
  const detailRes = await fetchIssueByIdRequest(issueId);
  assertOk(detailRes, 'Failed to load case details');
  const issue = mapIssueToDetail(detailRes.data);
  if (!issue) {
    throw new Error('Case not found');
  }

  const [activitiesRes, historyRes, attachmentsRes] = await Promise.all([
    fetchIssueActivitiesRequest(issueId).catch(() => ({
      status: 200,
      data: [] as any[],
    })),
    fetchIssueHistoryRequest(issueId).catch(() => ({
      status: 200,
      data: [] as any[],
    })),
    fetchIssueAttachmentsRequest(issueId).catch(() => ({
      status: 200,
      data: [] as any[],
    })),
  ]);

  const activities: CaseActivityItem[] = (activitiesRes.data || []).map(
    (a: any, i: number) => ({
      id: String(a?._id || a?.id || `act-${i}`),
      body: String(a?.body || a?.subject || '').trim() || '—',
      activityType: String(a?.activityType || 'NOTE'),
      createdAt: formatCaseDateTime(
        a?.interactionDate || a?.createdAt || a?.createdOn,
      ),
      createdBy: String(a?.createdBy || a?.actorEmail || a?.actorId || '—'),
    }),
  );

  const history: CaseHistoryItem[] = (historyRes.data || []).map(
    (h: any, i: number) => ({
      id: String(h?._id || h?.entityId || `hist-${i}`),
      summary: String(h?.summary || h?.action || 'Update').trim(),
      action: String(h?.action || ''),
      createdAt: formatCaseDateTime(h?.createdAt || h?.createdOn),
      actor: String(h?.actorEmail || h?.actorId || '—'),
    }),
  );

  const attachments: CaseAttachmentItem[] = (attachmentsRes.data || []).map(
    (f: any, i: number) => ({
      id: String(f?.id || f?._id || `${f?.activityId || 'file'}-${i}`),
      name: String(f?.name || f?.fileName || `Attachment ${i + 1}`),
      createdAt: formatCaseDateTime(f?.createdAt || f?.uploadedAt),
    }),
  );

  return { issue, activities, history, attachments };
};

export const loadActiveComplaintStatus = async () => {
  const res = await fetchIssueStatusesRequest('COMPLAINT');
  if (!(res.status >= 200 && res.status < 300)) return null;
  const active = (res.data || []).find(
    o => String(o.displayName || '').trim().toLowerCase() === 'active',
  );
  return active?.code || res.data?.[0]?.code || null;
};

/**
 * Create a COMPLAINT issue (CRM CreateCasesDrawer Save path, MemberHub subset).
 * Attachments follow Portal_App CreateCase: create first, then upload each file.
 */
export const createNewCase = async (
  values: NewCaseFormValues,
  attachments: PendingAttachment[] = [],
) => {
  if (!values.description?.trim()) {
    throw new Error('Description is required');
  }
  if (!values.complaintType) {
    throw new Error('Complaint type is required');
  }
  if (!values.ownerUserId) {
    throw new Error('owner.userId is required');
  }

  const issueStatus =
    values.issueStatus || (await loadActiveComplaintStatus()) || undefined;

  const payload = buildComplaintCreatePayload({
    ...values,
    issueStatus: issueStatus || null,
  });

  const res = await createIssueRequest(payload);
  assertOk(res, 'Failed to create case');

  const created = res.data;
  const newIssueId = created?._id || created?.id;

  const failedUploads: string[] = [];
  if (newIssueId && attachments.length > 0) {
    for (const file of attachments) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const uploadRes = await uploadIssueAttachmentRequest(newIssueId, file);
        if (!(uploadRes.status >= 200 && uploadRes.status < 300)) {
          failedUploads.push(file.name);
        }
      } catch {
        failedUploads.push(file.name);
      }
    }
  }

  return { created, failedUploads };
};

/** Portal CaseDetail — upload one or more files to an existing issue. */
export const uploadCaseAttachments = async (
  issueId: string,
  files: PendingAttachment[],
) => {
  if (!issueId) throw new Error('Missing case id');
  const failedUploads: string[] = [];
  for (const file of files) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const uploadRes = await uploadIssueAttachmentRequest(issueId, file);
      if (!(uploadRes.status >= 200 && uploadRes.status < 300)) {
        failedUploads.push(file.name);
      }
    } catch {
      failedUploads.push(file.name);
    }
  }
  if (failedUploads.length === files.length && files.length > 0) {
    throw new Error(
      `Failed to upload: ${failedUploads.join(', ')}`,
    );
  }
  return { failedUploads };
};
