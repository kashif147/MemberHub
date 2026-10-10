import { toApiDate } from './date.helper';
import { normalizeMobileToE164 } from './phone.helper';
import { isRetiredAssociateCategory } from './applicationCategory.helper';

/** Shared option shape for SelectField / CRM-style dropdowns */
export type LookupOption = { label: string; value: string };

const pickName = (item: any): string =>
  String(
    item?.lookupname ||
      item?.lookupName ||
      item?.name ||
      item?.DisplayName ||
      item?.label ||
      item?.countryName ||
      item?.country ||
      '',
  ).trim();

const pickId = (item: any): string =>
  String(
    item?._id ||
      item?.id ||
      item?.lookupId ||
      item?.value ||
      pickName(item) ||
      '',
  ).trim();

/** Lookup rows → { label, value } using display name as value (Portal UI style). */
export const mapLookupNameOptions = (items: any[] | null | undefined): LookupOption[] => {
  if (!Array.isArray(items)) return [];
  const seen = new Set<string>();
  const out: LookupOption[] = [];
  items.forEach(item => {
    const label = pickName(item);
    if (!label || seen.has(label.toLowerCase())) return;
    seen.add(label.toLowerCase());
    out.push({ label, value: label });
  });
  return out.sort((a, b) => a.label.localeCompare(b.label));
};

/** Categories / products — Portal stores display name as value */
export const mapCategoryOptions = (items: any[] | null | undefined): LookupOption[] => {
  if (!Array.isArray(items)) return [];
  return items
    .map(item => {
      const label = String(
        item?.name || item?.DisplayName || item?.label || item?.code || '',
      ).trim();
      if (!label) return null;
      return { label, value: label };
    })
    .filter(Boolean) as LookupOption[];
};

/** Countries — name as both label and value */
export const mapCountryOptions = (items: any[] | null | undefined): LookupOption[] => {
  if (!Array.isArray(items)) return [];
  const seen = new Set<string>();
  const out: LookupOption[] = [];
  items.forEach(item => {
    const label =
      typeof item === 'string'
        ? item
        : pickName(item) || String(item?.isoCode || '').trim();
    if (!label || seen.has(label.toLowerCase())) return;
    seen.add(label.toLowerCase());
    out.push({ label, value: label });
  });
  return out.sort((a, b) => a.label.localeCompare(b.label));
};

/** Display name for a work-location hierarchy/flat item (Portal ProfessionalDetails). */
export const getWorkLocationDisplayName = (item: any): string =>
  String(
    item?.lookup?.DisplayName ||
      item?.lookup?.lookupname ||
      item?.lookup?.name ||
      item?.DisplayName ||
      item?.lookupname ||
      item?.name ||
      item?.label ||
      '',
  ).trim();

/**
 * Map hierarchy API / flat work-location rows to select options.
 * Portal shape: { lookup: { DisplayName }, branch, region }
 * CRM flat shape: { lookupname, _id, processSalaryDeduction }
 * Also walks nested children trees when present.
 */
export const mapWorkLocationOptions = (
  items: any[] | null | undefined,
): LookupOption[] => {
  if (!Array.isArray(items)) return [];
  const out: LookupOption[] = [];
  const seen = new Set<string>();

  const pushName = (label: string) => {
    if (!label || seen.has(label.toLowerCase())) return;
    seen.add(label.toLowerCase());
    out.push({ label, value: label });
  };

  const walk = (node: any) => {
    if (!node) return;
    pushName(getWorkLocationDisplayName(node));
    const children =
      node.children ||
      node.childLookups ||
      node.lookups ||
      node.items ||
      node.workLocations ||
      [];
    if (Array.isArray(children)) children.forEach(walk);
  };

  items.forEach(walk);
  return out.sort((a, b) => a.label.localeCompare(b.label));
};

const isWorkLocationNode = (item: any): boolean => {
  if (!item || typeof item !== 'object') return false;
  if (item.lookup) return true;
  const type = String(item.type || item.lookuptypeName || '').toLowerCase();
  if (type === 'worklocation' || type === 'work_location') return true;
  // CRM simple format leaves are work locations when they carry a branch
  if (item.branch && (item.name || item.lookupname || item.DisplayName)) {
    return true;
  }
  return false;
};

const getChildren = (node: any): any[] => {
  const children =
    node?.children ||
    node?.childLookups ||
    node?.lookups ||
    node?.items ||
    node?.workLocations ||
    [];
  return Array.isArray(children) ? children : [];
};

/**
 * Normalize hierarchy / flat work-location rows to Portal item shape:
 * `{ lookup, branch, region }` so ProfessionalDetails can resolve branch/region.
 *
 * Supports:
 * - Portal hierarchy: `{ lookup, branch, region }`
 * - CRM format=simple: `{ type: 'workLocation', name, branch: { name, region } }`
 * - Flat `/lookup` Work Location rows with Parentlookupid chain
 * - Nested trees (walks children to work-location leaves)
 */
export const toWorkLocationLookupItems = (
  items: any[] | null | undefined,
  allLookups: any[] = [],
) => {
  if (!Array.isArray(items)) return [];

  const findById = (id: any) => {
    if (!id || !allLookups?.length) return null;
    const key = String(typeof id === 'object' ? id._id || id.id : id);
    if (!key || key === '[object Object]') return typeof id === 'object' ? id : null;
    return (
      allLookups.find(l => String(l?._id || l?.id) === key) ||
      (typeof id === 'object' ? id : null)
    );
  };

  const resolveBranchRegion = (item: any) => {
    let branch =
      item?.branch ||
      (item?.Parentlookupid && typeof item.Parentlookupid === 'object'
        ? item.Parentlookupid
        : findById(item?.Parentlookupid));

    if (branch && typeof branch !== 'object') {
      branch = findById(branch);
    }

    let region =
      item?.region ||
      item?.branch?.region ||
      (branch?.Parentlookupid && typeof branch.Parentlookupid === 'object'
        ? branch.Parentlookupid
        : findById(branch?.Parentlookupid));

    if (region && typeof region !== 'object') {
      region = findById(region);
    }

    return {
      branch: branch || undefined,
      region: region || undefined,
    };
  };

  const normalizeOne = (item: any) => {
    if (!item) return null;

    // Already Portal-shaped
    if (item.lookup) {
      const { branch, region } = resolveBranchRegion(item);
      return {
        ...item,
        branch: item.branch || branch,
        region: item.region || region,
      };
    }

    const { branch, region } = resolveBranchRegion(item);
    const name =
      item.DisplayName ||
      item.lookupname ||
      item.name ||
      item.label ||
      '';

    return {
      lookup: {
        ...item,
        DisplayName: name,
        lookupname: item.lookupname || name,
        _id: item._id || item.id,
        processSalaryDeduction: item.processSalaryDeduction,
      },
      branch: branch || undefined,
      region: region || undefined,
    };
  };

  const out: any[] = [];
  const seen = new Set<string>();

  const walk = (node: any) => {
    if (!node) return;
    const children = getChildren(node);
    if (children.length) {
      children.forEach(walk);
      // Only treat as a work location if it looks like one (not a region/branch parent)
      if (!isWorkLocationNode(node)) return;
    }

    const normalized = normalizeOne(node);
    if (!normalized) return;
    const key =
      String(
        normalized.lookup?._id ||
          normalized.lookup?.id ||
          getWorkLocationDisplayName(normalized),
      ).toLowerCase() || '';
    if (!key || seen.has(key)) return;
    // Skip empty names (e.g. bare region/branch parents)
    if (!getWorkLocationDisplayName(normalized)) return;
    seen.add(key);
    out.push(normalized);
  };

  items.forEach(walk);
  return out;
};

export const findOptionLabel = (
  options: LookupOption[],
  value: string,
): string => {
  if (!value) return '';
  const hit = options.find(o => o.value === value || o.label === value);
  return hit?.label || value;
};

export {
  isUndergraduateStudentCategory as isUndergraduateCategory,
  isRetiredAssociateCategory as isRetiredCategory,
} from './applicationCategory.helper';

export { toApiDate } from './date.helper';
export { normalizeMobileToE164 } from './phone.helper';

const mapNurseTypeToAPI = (displayValue?: string) => {
  if (!displayValue) return '';
  const reverseMapping: Record<string, string> = {
    'General Nurse': 'generalNursing',
    General: 'generalNursing',
    'Public Health Nurse': 'publicHealthNursing',
    'Mental health nurse': 'mentalHealthNursing',
    Psychiatric: 'mentalHealthNursing',
    Midwife: 'midwifery',
    Midwifery: 'midwifery',
    "Sick Children's Nurse": 'sickChildrenNursing',
    'Registered Nurse for Intellectual Disability':
      'intellectualDisabilityNursing',
    'Intellectual Disability': 'intellectualDisabilityNursing',
  };
  return reverseMapping[displayValue] || displayValue;
};

const omitEmpty = (obj: Record<string, any>) => {
  const out: Record<string, any> = {};
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  });
  return out;
};

/** Portal / CRM personal-details body */
export const buildPersonalPayload = (data: Record<string, any>) => ({
  personalInfo: omitEmpty({
    title: data.title,
    surname: data.surname,
    forename: data.forename,
    gender: data.gender,
    dateOfBirth: toApiDate(data.dob) || data.dob,
    countryPrimaryQualification: data.countryPrimaryQualification,
  }),
  contactInfo: omitEmpty({
    preferredAddress: data.preferredAddress
      ? String(data.preferredAddress).toLowerCase()
      : data.preferredAddress,
    eircode: data.eircode,
    buildingOrHouse: data.addressLine1,
    streetOrRoad: data.addressLine2,
    areaOrTown: data.addressLine3,
    countyCityOrPostCode: data.addressLine4,
    country: data.country || 'Ireland',
    mobileNumber: normalizeMobileToE164(data.mobileNo),
    telephoneNumber: data.homeWorkTelNo,
    preferredEmail: data.preferredEmail
      ? String(data.preferredEmail).toLowerCase()
      : data.preferredEmail,
    personalEmail: data.personalEmail,
    workEmail: data.workEmail,
    consent: data.consent !== false,
  }),
});

/** Portal / CRM professional-details body */
export const buildProfessionalPayload = (data: Record<string, any>) => {
  const nursingAdaptationProgramme =
    data?.nursingAdaptationProgramme === 'yes' ||
    data?.nursingAdaptationProgramme === true;
  const nurseTypeAPI = data.nurseType ? mapNurseTypeToAPI(data.nurseType) : '';
  const retired = isRetiredAssociateCategory(data?.membershipCategory);

  return {
    professionalDetails: omitEmpty({
      membershipCategory: data.membershipCategory,
      workLocation: data.workLocation,
      otherWorkLocation: data.otherWorkLocation,
      grade: data.grade,
      otherGrade: data.otherGrade,
      nmbiNumber: data.nmbiNo || data.nmbiNumber || '',
      nurseType: nurseTypeAPI,
      nursingAdaptationProgramme,
      region: data.region,
      branch: data.branch,
      pensionNo: data.pensionNo,
      isRetired: retired,
      retiredDate: toApiDate(data.retiredDate) || data.retiredDate,
      studyLocation: data.studyLocation,
      startDate: toApiDate(data.startDate) || data.startDate,
      graduationDate: toApiDate(data.graduationDate) || data.graduationDate,
      discipline: data.discipline,
    }),
  };
};

/** Portal / CRM subscription-details body */
export const buildSubscriptionPayload = (
  data: Record<string, any>,
  membershipCategory?: string,
) => ({
  subscriptionDetails: omitEmpty({
    membershipCategory: membershipCategory || data.membershipCategory,
    paymentType: data.paymentType,
    payrollNo: data.payrollNo,
    membershipStatus: data.memberStatus,
    otherIrishTradeUnion: data.otherIrishTradeUnion === 'yes',
    otherIrishTradeUnionName: data.otherIrishTradeUnionName,
    otherScheme: data.otherScheme === 'yes' || data.otherScheme === true,
    previousMembershipNumber: data.previousMembershipNumber,
    joinYouthForum: data.joinYouthForum === 'yes',
    youthForum: data.youthForum,
    recuritedBy: data.recuritedBy,
    recuritedByMembershipNo: data.recuritedByMembershipNo,
    primarySection: data.primarySection,
    otherPrimarySection: data.otherPrimarySection,
    secondarySection: data.secondarySection,
    otherSecondarySection: data.otherSecondarySection,
    incomeProtectionScheme: data.incomeProtectionScheme === true,
    inmoRewards: data.inmoRewards === true,
    exclusiveDiscountsAndOffers: data.exclusiveDiscountsAndOffers === true,
    valueAddedServices: data.valueAddedServices === true,
    termsAndConditions: data.termsAndConditions === true,
    paymentFrequency: data.paymentFrequency,
    // CRM ApplicationMgtDrawer defaults
    dateJoined: data.dateJoined || new Date().toISOString(),
    submissionDate: data.submissionDate || new Date().toISOString(),
  }),
});

export const extractApplicationId = (res: any): string | null => {
  const d = res?.data?.data ?? res?.data ?? res;
  return (
    d?.applicationId ||
    d?._id ||
    d?.id ||
    d?.personalDetails?.applicationId ||
    null
  );
};

export const extractApiError = (res: any, fallback = 'Request failed') => {
  const d = res?.data;
  if (!d) return fallback;
  if (typeof d?.error?.message === 'string') return d.error.message;
  if (typeof d?.message === 'string') return d.message;
  if (typeof d?.error === 'string') return d.error;
  return fallback;
};
