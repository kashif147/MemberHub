import { createAuthedClient } from './createClient';
import { ISSUE_SERVICE_URL } from '../constants/config';

const client = createAuthedClient(ISSUE_SERVICE_URL);

const unwrap = (res: any) => res?.data?.data ?? res?.data;

export type IssueLookupItem = {
  id?: string;
  code: string;
  displayName: string;
};

export type IssueDropdownLookups = {
  issueTypes: IssueLookupItem[];
  origins: IssueLookupItem[];
  issueSources: IssueLookupItem[];
  priorities: IssueLookupItem[];
  complaintTypes: IssueLookupItem[];
  allIssueStatuses?: IssueLookupItem[];
};

const toList = (raw: any): IssueLookupItem[] => {
  const arr = Array.isArray(raw) ? raw : [];
  return arr
    .map((item: any) => ({
      id: item?.id || item?._id,
      code: String(item?.code || item?.value || ''),
      displayName: String(
        item?.displayName || item?.label || item?.name || item?.code || '',
      ),
    }))
    .filter(i => i.code);
};

/** Same as ProjectShell-1 issuesApi.fetchIssueDropdownLookups */
export const fetchIssueDropdownLookupsRequest = async () => {
  const res = await client.get('/issue-dropdown-lookups');
  const data = unwrap(res) || {};
  return {
    status: res.status,
    data: {
      issueTypes: toList(data.issueTypes),
      origins: toList(data.origins),
      issueSources: toList(data.issueSources),
      priorities: toList(data.priorities),
      complaintTypes: toList(data.complaintTypes),
      allIssueStatuses: toList(data.allIssueStatuses),
    } as IssueDropdownLookups,
    error: res.data,
  };
};

/** Same as ProjectShell-1 issuesApi.fetchIssueStatuses */
export const fetchIssueStatusesRequest = async (issueType: string) => {
  if (!issueType) {
    return { status: 200, data: [] as IssueLookupItem[], error: null };
  }
  const res = await client.get('/issue-statuses', {
    params: { issueType },
  });
  return {
    status: res.status,
    data: toList(unwrap(res)),
    error: res.data,
  };
};

/** Same as ProjectShell-1 issuesApi.fetchIssues — GET /issues */
export const fetchIssuesRequest = async (params: Record<string, any> = {}) => {
  const res = await client.get('/issues', { params });
  const raw = unwrap(res);
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data)
      ? raw.data
      : Array.isArray(raw?.results)
        ? raw.results
        : Array.isArray(raw?.issues)
          ? raw.issues
          : [];
  return {
    status: res.status,
    data: list,
    error: res.data,
  };
};

/** Same as ProjectShell-1 issuesApi.fetchIssueById */
export const fetchIssueByIdRequest = async (issueId: string) => {
  const res = await client.get(`/issues/${issueId}`);
  return {
    status: res.status,
    data: unwrap(res),
    error: res.data,
  };
};

/** Same as ProjectShell-1 issuesApi.fetchActivities */
export const fetchIssueActivitiesRequest = async (issueId: string) => {
  const res = await client.get(`/issues/${issueId}/activities`);
  const raw = unwrap(res);
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data)
      ? raw.data
      : Array.isArray(raw?.activities)
        ? raw.activities
        : [];
  return { status: res.status, data: list, error: res.data };
};

/** Same as ProjectShell-1 issuesApi.fetchIssueHistory */
export const fetchIssueHistoryRequest = async (issueId: string) => {
  const res = await client.get(`/issues/${issueId}/history`);
  const raw = unwrap(res);
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data)
      ? raw.data
      : Array.isArray(raw?.history)
        ? raw.history
        : [];
  return { status: res.status, data: list, error: res.data };
};

/** Same as ProjectShell-1 issuesApi.fetchIssueAttachments */
export const fetchIssueAttachmentsRequest = async (issueId: string) => {
  const res = await client.get(`/issues/${issueId}/attachments`);
  const raw = unwrap(res);
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data)
      ? raw.data
      : Array.isArray(raw?.attachments)
        ? raw.attachments
        : [];
  return { status: res.status, data: list, error: res.data };
};

/** Same as ProjectShell-1 issuesApi.createIssue */
export const createIssueRequest = async (payload: Record<string, any>) => {
  const res = await client.post('/issues', payload);
  return {
    status: res.status,
    data: unwrap(res),
    error: res.data,
  };
};

/**
 * Same as ProjectShell-1 issuesApi.uploadIssueAttachment.
 * File shape matches Portal_App / @react-native-documents/picker results.
 */
export const uploadIssueAttachmentRequest = async (
  issueId: string,
  file: { uri: string; name?: string; type?: string },
) => {
  const formData = new FormData();
  formData.append('file', {
    uri: file.uri,
    name: file.name || 'attachment',
    type: file.type || 'application/octet-stream',
  } as any);
  const res = await client.post(`/issues/${issueId}/attachments`, formData);
  return {
    status: res.status,
    data: unwrap(res),
    error: res.data,
  };
};
