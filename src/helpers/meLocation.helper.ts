/** Normalize /me (or JWT) location fields into filter value arrays. */

const asName = (value: any): string => {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value).trim();
  }
  if (typeof value === 'object') {
    return String(
      value.DisplayName ||
        value.lookupname ||
        value.name ||
        value.label ||
        value.value ||
        '',
    ).trim();
  }
  return '';
};

const toValues = (raw: any): string[] => {
  if (raw == null || raw === '') return [];
  if (Array.isArray(raw)) {
    return [...new Set(raw.map(asName).filter(Boolean))];
  }
  // Skip CRM display scope strings like "Beaumont & Mater branches"
  if (typeof raw === 'string' && /\s&\s/.test(raw)) {
    return [];
  }
  const single = asName(raw);
  return single ? [single] : [];
};

const firstNonEmpty = (...candidates: any[]): string[] => {
  for (const c of candidates) {
    const values = toValues(c);
    if (values.length) return values;
  }
  return [];
};

export type MeLocationScope = {
  workLocations: string[];
  branches: string[];
  regions: string[];
  /** Short label for header / "YOUR SCOPE" */
  scopeLabel: string;
};

/** Parent branch names from work-location rows (CRM /me assignedLocations). */
const parentBranchesFromWorkLocations = (raw: any): string[] => {
  if (!Array.isArray(raw)) return [];
  return [
    ...new Set(
      raw
        .map(
          (item: any) =>
            asName(item?.parentLookupName) ||
            asName(item?.Parentlookup) ||
            asName(item?.parentLookup) ||
            asName(item?.branch) ||
            asName(item?.branchName),
        )
        .filter(Boolean),
    ),
  ];
};

/**
 * Pull workLocation / branch / region from CRM /api/me payload.
 * Primary path: `assignedLocations.workLocations` (CRM Branch Officer scope).
 */
export const extractLocationScopeFromMe = (payload: any): MeLocationScope => {
  const data = payload?.data?.data ?? payload?.data ?? payload ?? {};
  const assigned =
    data?.assignedLocations ||
    data?.assignedLocation ||
    data?.data?.assignedLocations ||
    {};
  const professional =
    data?.professionalDetails ||
    data?.professional ||
    data?.profile?.professionalDetails ||
    {};
  const assignment =
    data?.assignment || data?.scope || data?.officerScope || data?.memberHub || {};

  const assignedWorkLocations = assigned?.workLocations || assigned?.workLocation;

  const workLocations = firstNonEmpty(
    assignedWorkLocations,
    data.workLocations,
    data.workLocation,
    data.work_location,
    data.WorkLocation,
    data.location,
    data.locations,
    professional.workLocation,
    professional.workLocations,
    assignment.workLocations,
    assignment.workLocation,
    data?.user?.workLocation,
    data?.user?.workLocations,
  );

  const branches = firstNonEmpty(
    assigned?.branches,
    assigned?.branch,
    data.branch,
    data.branchName,
    Array.isArray(data.branches) ? data.branches : null,
    professional.branch,
    professional.branches,
    assignment.branch,
    Array.isArray(assignment.branches) ? assignment.branches : null,
    // CRM often leaves assignedLocations.branches empty but sets parentLookupName on WL
    parentBranchesFromWorkLocations(assignedWorkLocations),
  );

  const regions = firstNonEmpty(
    assigned?.regions,
    assigned?.region,
    data.regions,
    data.region,
    data.regionName,
    professional.region,
    professional.regions,
    assignment.regions,
    assignment.region,
  );

  const scopeParts = [
    ...workLocations,
    ...branches.filter(b => !workLocations.includes(b)),
  ];
  const scopeLabel =
    scopeParts.length > 0
      ? scopeParts.slice(0, 3).join(' · ') +
        (scopeParts.length > 3 ? ` +${scopeParts.length - 3}` : '')
      : regions[0] || 'Assigned locations';

  return { workLocations, branches, regions, scopeLabel };
};

/** Build CRM subscription filter clauses from /me location scope. */
export const buildMemberLocationFilters = (scope: MeLocationScope) => {
  const filters: Record<string, { operator: string; values: string[] }> = {};
  if (scope.workLocations.length) {
    filters.workLocation = {
      operator: 'equal_to',
      values: scope.workLocations,
    };
  }
  if (scope.regions.length) {
    filters.region = {
      operator: 'equal_to',
      values: scope.regions,
    };
  }
  if (scope.branches.length) {
    filters.branch = {
      operator: 'equal_to',
      values: scope.branches,
    };
  }
  return filters;
};
