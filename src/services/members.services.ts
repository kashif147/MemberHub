import { filterSubscriptionsRequest } from '../api/subscription.api';
import {
  MEMBERS_FILTER_TEMPLATE_ID,
} from '../constants/config';
import {
  buildMemberLocationFilters,
  type MeLocationScope,
} from '../helpers/meLocation.helper';
import {
  mapSubscriptionRowToMember,
  MEMBERS_FILTER_COLUMNS,
} from '../helpers/members.helper';
import type { Member } from '../data/mockMembers';
import type { AuthUser } from '../store/initialState';

export type MembersFetchResult = {
  members: Member[];
  totalCount: number;
  scopeLabel: string;
  filters: Record<string, { operator: string; values: string[] }>;
};

const scopeFromUser = (user: AuthUser | null | undefined): MeLocationScope => ({
  workLocations: user?.workLocations || [],
  branches: user?.branchFilters || [],
  regions: user?.regionFilters || [],
  scopeLabel: user?.branches || 'Assigned locations',
});

/**
 * Load members for the signed-in officer's /me workLocation (and branch/region),
 * via CRM PUT /subscriptions/filter — same as ProjectShell-1 /members.
 */
export const fetchMembersForUser = async (
  user: AuthUser | null | undefined,
): Promise<MembersFetchResult> => {
  const scope = scopeFromUser(user);
  const filters = buildMemberLocationFilters(scope);

  if (
    !filters.workLocation &&
    !filters.branch &&
    !filters.region
  ) {
    return {
      members: [],
      totalCount: 0,
      scopeLabel: scope.scopeLabel,
      filters,
    };
  }

  const res = await filterSubscriptionsRequest({
    templateId: MEMBERS_FILTER_TEMPLATE_ID,
    page: 1,
    limit: 500,
    filters,
    columns: MEMBERS_FILTER_COLUMNS,
  });

  if (!(res?.status >= 200 && res?.status < 300)) {
    const msg =
      res?.data?.message ||
      res?.data?.error?.message ||
      `Failed to load members (${res?.status || 'network'})`;
    throw new Error(typeof msg === 'string' ? msg : 'Failed to load members');
  }

  const body = res?.data?.data ?? res?.data ?? {};
  const rows = Array.isArray(body?.data)
    ? body.data
    : Array.isArray(body?.results)
      ? body.results
      : Array.isArray(body)
        ? body
        : [];

  const members = rows.map(mapSubscriptionRowToMember);
  const totalCount =
    Number(body?.pagination?.totalCount ?? body?.count ?? members.length) ||
    members.length;

  return {
    members,
    totalCount,
    scopeLabel: scope.scopeLabel,
    filters,
  };
};
