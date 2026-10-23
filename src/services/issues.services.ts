import {
  createIssueActivityRequest,
  createIssueRequest,
  extractUploadErrorMessage,
  fetchAttachmentDownloadUrlRequest,
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
  CASE_ATTACHMENT_TYPES_HINT,
  isAllowedCaseAttachment,
} from '../helpers/documentPicker.helper';
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
    .filter((c: CaseItem) => Boolean(c.id));
};

export type CaseActivityAttachment = {
  index: number;
  id: string;
  name: string;
  createdAt: string;
  url?: string;
};

export type CaseActivityItem = {
  id: string;
  body: string;
  activityType: string;
  createdAt: string;
  createdBy: string;
  /** Attachments logged on this activity (Portal CaseDetail activity cards). */
  attachments: CaseActivityAttachment[];
};

export type CaseHistoryItem = {
  id: string;
  summary: string;
  action: string;
  createdAt: string;
  actor: string;
  entityType?: string;
  changedFields?: Array<Record<string, any>>;
};

export type CaseAttachmentItem = {
  id: string;
  name: string;
  createdAt: string;
  /** Required for CRM download/view SAS URL */
  activityId?: string;
  index?: number;
  /** Optional direct URL when already present on the attachment row */
  url?: string;
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
    (a: any, i: number) => {
      const activityId = String(a?._id || a?.id || `act-${i}`);
      const rawAttachments = Array.isArray(a?.attachments)
        ? a.attachments
        : Array.isArray(a?.files)
          ? a.files
          : [];
      return {
        id: activityId,
        body: String(a?.body || a?.subject || '').trim() || '—',
        activityType: String(a?.activityType || 'NOTE'),
        createdAt: formatCaseDateTime(
          a?.interactionDate || a?.createdAt || a?.createdOn,
        ),
        createdBy: String(a?.createdBy || a?.actorEmail || a?.actorId || '—'),
        attachments: rawAttachments.map((item: any, attachmentIndex: number) => ({
          index:
            typeof item?.index === 'number' ? item.index : attachmentIndex,
          id: String(item?._id || item?.id || `${activityId}-${attachmentIndex}`),
          name: String(
            item?.filename ||
              item?.fileName ||
              item?.originalName ||
              item?.name ||
              `Attachment ${attachmentIndex + 1}`,
          ),
          createdAt: formatCaseDateTime(
            item?.createdAt ||
              item?.uploadedAt ||
              a?.interactionDate ||
              a?.createdAt,
          ),
          url: String(item?.url || item?.downloadUrl || '').trim() || undefined,
        })),
      };
    },
  );

  const history: CaseHistoryItem[] = (historyRes.data || []).map(
    (h: any, i: number) => ({
      id: String(h?._id || h?.entityId || `hist-${i}`),
      summary: String(h?.summary || h?.action || 'Update').trim(),
      action: String(h?.action || '').toUpperCase(),
      createdAt: formatCaseDateTime(h?.createdAt || h?.createdOn),
      actor: String(
        h?.actorEmail || h?.actorName || h?.actorId || '—',
      ),
      entityType: h?.entityType ? String(h.entityType) : undefined,
      changedFields: Array.isArray(h?.changedFields) ? h.changedFields : [],
    }),
  );

  const attachments: CaseAttachmentItem[] = (attachmentsRes.data || []).map(
    (f: any, i: number) => {
      const activityId = String(f?.activityId || f?.activity_id || '');
      const index =
        typeof f?.index === 'number'
          ? f.index
          : typeof f?.attachmentIndex === 'number'
            ? f.attachmentIndex
            : i;
      return {
        id: String(
          f?.id || f?._id || `${activityId || 'file'}-${index}`,
        ),
        name: String(
          f?.name || f?.fileName || f?.filename || `Attachment ${i + 1}`,
        ),
        createdAt: formatCaseDateTime(f?.createdAt || f?.uploadedAt),
        activityId: activityId || undefined,
        index,
        url: String(f?.url || f?.downloadUrl || '').trim() || undefined,
      };
    },
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
  if (!values.dateReceived?.trim()) {
    throw new Error('dateReceived is required');
  }
  if (!values.origin?.trim()) {
    throw new Error('origin is required');
  }

  const issueStatus =
    values.issueStatus ||
    (await loadActiveComplaintStatus()) ||
    'ACTIVE';

  const payload = buildComplaintCreatePayload({
    ...values,
    issueStatus,
  });

  const res = await createIssueRequest(payload);
  assertOk(res, 'Failed to create case');

  const created = res.data;
  const newIssueId = created?._id || created?.id;

  const failedUploads: string[] = [];
  if (newIssueId && attachments.length > 0) {
    for (const file of attachments) {
      if (!isAllowedCaseAttachment(file)) {
        failedUploads.push(
          `${file.name} (use ${CASE_ATTACHMENT_TYPES_HINT})`,
        );
        continue;
      }
      try {
        // eslint-disable-next-line no-await-in-loop
        const uploadRes = await uploadIssueAttachmentRequest(newIssueId, file);
        if (!(uploadRes.status >= 200 && uploadRes.status < 300)) {
          failedUploads.push(
            `${file.name}: ${extractUploadErrorMessage(uploadRes, 'upload failed')}`,
          );
        }
      } catch (e: any) {
        failedUploads.push(
          `${file.name}: ${e?.message || 'upload failed'}`,
        );
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
    if (!isAllowedCaseAttachment(file)) {
      failedUploads.push(
        `${file.name} (use ${CASE_ATTACHMENT_TYPES_HINT})`,
      );
      continue;
    }
    try {
      // eslint-disable-next-line no-await-in-loop
      const uploadRes = await uploadIssueAttachmentRequest(issueId, file);
      if (!(uploadRes.status >= 200 && uploadRes.status < 300)) {
        failedUploads.push(
          `${file.name}: ${extractUploadErrorMessage(uploadRes, 'upload failed')}`,
        );
      }
    } catch (e: any) {
      failedUploads.push(`${file.name}: ${e?.message || 'upload failed'}`);
    }
  }
  if (failedUploads.length === files.length && files.length > 0) {
    throw new Error(`Failed to upload: ${failedUploads.join(', ')}`);
  }
  return { failedUploads };
};

/**
 * CRM CasesDetails handlePostActivity — log a NOTE on an open issue.
 * Optional file mirrors Portal CaseDetail comment + attachment (upload after NOTE).
 */
export const addCaseNote = async (
  issueId: string,
  noteText: string,
  file?: PendingAttachment | null,
) => {
  if (!issueId) throw new Error('Missing case id');
  const body = String(noteText || '').trim();
  if (!body && !file) {
    throw new Error('Please enter a comment or attach a file.');
  }

  let created: any = null;
  if (body) {
    const res = await createIssueActivityRequest(issueId, {
      activityType: 'NOTE',
      subject: null,
      body,
      interactionDate: new Date().toISOString(),
      pertinentToFileReview: false,
      sendNotification: true,
      visibleToMember: false,
    });
    assertOk(res, extractUploadErrorMessage(res, 'Failed to add comment'));
    created = res.data;
  }

  let failedUploads: string[] = [];
  if (file) {
    const uploadResult = await uploadCaseAttachments(issueId, [file]);
    failedUploads = uploadResult.failedUploads;
  }

  return { created, failedUploads };
};

/** History action badge color — same palette as Portal getHistoryActionColor. */
export const getHistoryActionColor = (action?: string) => {
  const value = String(action || '').toUpperCase();
  if (value === 'CREATED') return '#6A5DC0';
  if (value === 'UPDATED') return '#FF8B00';
  if (value === 'DELETED') return '#DE350B';
  return '#6B778C';
};

/**
 * CRM CasesDetails openAttachment — resolve SAS URL then open (view/download).
 */
export const resolveCaseAttachmentUrl = async (
  file: CaseAttachmentItem,
): Promise<string> => {
  if (file.url) return file.url;
  if (!file.activityId || file.index == null) {
    throw new Error('Unable to open this attachment.');
  }
  const res = await fetchAttachmentDownloadUrlRequest(
    file.activityId,
    file.index,
  );
  assertOk(res, extractUploadErrorMessage(res, 'Failed to open attachment'));
  const url = String(
    res?.data?.url || res?.data?.downloadUrl || res?.data || '',
  ).trim();
  if (!url || !/^https?:\/\//i.test(url)) {
    throw new Error('Download link unavailable for this attachment.');
  }
  return url;
};
