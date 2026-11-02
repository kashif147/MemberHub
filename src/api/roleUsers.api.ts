import request from './request';

/**
 * Users holding a given resource:action permission — same as ProjectShell-1
 * roleUsersService.fetchUsersByPermission
 * (GET /api/roles/users/by-permission).
 */
export type TeamUserOption = {
  value: string;
  label: string;
};

/** issueType → RBAC resource (ProjectShell ISSUE_TYPE_TO_TEAM_RESOURCE). */
export const ISSUE_TYPE_TO_TEAM_RESOURCE: Record<string, string> = {
  COMPLAINT: 'issues-complaints',
  FTP: 'issues-ftp',
  IR: 'issues-ir',
  DP: 'issues-dataprotection',
};

export const COMPLAINT_TEAM_RESOURCE = ISSUE_TYPE_TO_TEAM_RESOURCE.COMPLAINT;

const normalizeUsers = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.users)) return data.users;
  return [];
};

const toUserOption = (user: any): TeamUserOption | null => {
  const value = String(user?._id || user?.id || '').trim();
  if (!value) return null;
  const label =
    String(
      user?.userFullName ||
        [user?.userFirstName, user?.userLastName].filter(Boolean).join(' ') ||
        user?.userEmail ||
        user?.email ||
        '',
    ).trim() || 'Unknown';
  return { value, label };
};

export const fetchUsersByPermissionRequest = async (
  resource: string,
  action = 'write',
  { q = '', limit = 40 }: { q?: string; limit?: number } = {},
) => {
  if (!resource) {
    return { status: 200, data: [] as TeamUserOption[], error: null };
  }
  const res = await request.get('/api/roles/users/by-permission', {
    params: {
      resource,
      action,
      limit: String(limit),
      ...(q ? { q } : {}),
    },
  });
  const users = normalizeUsers(res?.data?.data ?? res?.data);
  const options = users
    .map(toUserOption)
    .filter((o): o is TeamUserOption => Boolean(o));
  return {
    status: res.status,
    data: options,
    error: res.data,
  };
};
