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

export type MeWorkLocationRow = {
  /** Lookup id from /me assignedLocations.workLocations — used by membership drives. */
  id: string;
  name: string;
  branch: string;
  region: string;
};

export type MeLocationScope = {
  workLocations: string[];
  branches: string[];
  regions: string[];
  /** Short label for header / "YOUR SCOPE" */
  scopeLabel: string;
  /** Rich rows from assignedLocations.workLocations (branch/region per site). */
  workLocationRows: MeWorkLocationRow[];
};

const branchFromWorkLocationItem = (item: any): string =>
  asName(item?.parentLookupName) ||
  asName(item?.Parentlookup) ||
  asName(item?.parentLookup) ||
  asName(item?.branch) ||
  asName(item?.branchName) ||
  asName(item?.branch?.DisplayName) ||
  asName(item?.branch?.lookupname) ||
  asName(item?.branch?.name) ||
  '';

const regionFromWorkLocationItem = (item: any): string =>
  asName(item?.region) ||
  asName(item?.regionName) ||
  asName(item?.Region) ||
  asName(item?.branch?.region) ||
  asName(item?.branch?.region?.DisplayName) ||
  asName(item?.branch?.region?.lookupname) ||
  asName(item?.branch?.region?.name) ||
  asName(item?.parentRegion) ||
  asName(item?.ParentRegion) ||
  '';

/** Parent branch names from work-location rows (CRM /me assignedLocations). */
const parentBranchesFromWorkLocations = (raw: any): string[] => {
  if (!Array.isArray(raw)) return [];
  return [
    ...new Set(raw.map(branchFromWorkLocationItem).filter(Boolean)),
  ];
};

const asLookupId = (item: any): string => {
  if (item == null) return '';
  if (typeof item === 'string' || typeof item === 'number') {
    // Bare strings are display names in some fallbacks — not usable as lookup ids.
    return '';
  }
  return String(
    item.id || item._id || item.lookupId || item.LookupId || '',
  ).trim();
};

/** Normalize assignedLocations.workLocations into id + name + branch + region rows. */
export const mapMeWorkLocationRows = (raw: any): MeWorkLocationRow[] => {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const rows: MeWorkLocationRow[] = [];
  raw.forEach((item: any) => {
    const name = asName(item);
    if (!name) return;
    const id = asLookupId(item);
    const key = (id || name).toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    rows.push({
      id,
      name,
      branch: branchFromWorkLocationItem(item),
      region: regionFromWorkLocationItem(item),
    });
  });
  return rows.sort((a, b) => a.name.localeCompare(b.name));
};

export const findMeWorkLocationRow = (
  workLocation: string | undefined,
  rows: MeWorkLocationRow[] = [],
): MeWorkLocationRow | null => {
  if (!workLocation || workLocation === 'other') return null;
  const target = workLocation.trim().toLowerCase();
  return (
    rows.find(r => r.name.toLowerCase() === target) || null
  );
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

  const workLocationRows = mapMeWorkLocationRows(assignedWorkLocations);
  // Prefer names from rich rows when present (keeps order aligned with branch/region)
  const resolvedWorkLocations = workLocationRows.length
    ? workLocationRows.map(r => r.name)
    : workLocations;

  const scopeParts = [
    ...resolvedWorkLocations,
    ...branches.filter(b => !resolvedWorkLocations.includes(b)),
  ];
  const scopeLabel =
    scopeParts.length > 0
      ? scopeParts.slice(0, 3).join(' · ') +
        (scopeParts.length > 3 ? ` +${scopeParts.length - 3}` : '')
      : regions[0] || 'Assigned locations';

  return {
    workLocations: resolvedWorkLocations,
    branches,
    regions,
    scopeLabel,
    workLocationRows,
  };
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
