/** Payment / work-location helpers — Portal_App subscriptionPricing.helper */

const normalizePaymentType = (paymentType?: string) =>
  String(paymentType || '')
    .trim()
    .toLowerCase();

export const isAnnualAutoPaymentType = (paymentType?: string) => {
  const normalized = normalizePaymentType(paymentType);
  return (
    normalized.includes('credit card') ||
    normalized.includes('cheque') ||
    normalized.includes('cash')
  );
};

export const isStandingOrderPaymentType = (paymentType?: string) =>
  normalizePaymentType(paymentType).includes('standing');

export const isSalaryDeductionPaymentType = (paymentType?: string) => {
  const normalized = normalizePaymentType(paymentType);
  if (normalized.includes('direct') && normalized.includes('debit')) {
    return false;
  }
  return (
    (normalized.includes('salary') && normalized.includes('deduction')) ||
    normalized === 'deduction' ||
    normalized.includes('payroll') ||
    (normalized.includes('deduction') && normalized.includes('source'))
  );
};

export const isDirectDebitPaymentType = (paymentType?: string) => {
  const normalized = normalizePaymentType(paymentType);
  return normalized.includes('direct') && normalized.includes('debit');
};

export const isDeductionOrDebitPaymentType = (paymentType?: string) =>
  isSalaryDeductionPaymentType(paymentType) ||
  isDirectDebitPaymentType(paymentType);

export const getPaymentFrequencyCategory = (paymentType?: string) => {
  if (isAnnualAutoPaymentType(paymentType)) return 'annual';
  if (isStandingOrderPaymentType(paymentType)) return 'standingOrder';
  if (isDeductionOrDebitPaymentType(paymentType)) return 'deductionDebit';
  return null;
};

export const STANDING_ORDER_FREQUENCY_OPTIONS = [
  { value: 'Weekly', label: 'Weekly' },
  { value: 'Fortnightly', label: 'Fortnightly' },
  { value: 'Monthly', label: 'Monthly' },
  { value: 'Quarterly', label: 'Quarterly' },
  { value: 'Annually', label: 'Annually' },
];

export const DEDUCTION_DEBIT_FREQUENCY_OPTIONS = [
  { value: 'Monthly', label: 'Monthly' },
  { value: 'Quarterly', label: 'Quarterly' },
  { value: 'Annually', label: 'Annually' },
];

export const getFrequencyOptionsForPaymentType = (paymentType?: string) => {
  const category = getPaymentFrequencyCategory(paymentType);
  if (category === 'standingOrder') return STANDING_ORDER_FREQUENCY_OPTIONS;
  if (category === 'deductionDebit') return DEDUCTION_DEBIT_FREQUENCY_OPTIONS;
  return [];
};

export const getDefaultFrequencyForPaymentType = (paymentType?: string) => {
  const category = getPaymentFrequencyCategory(paymentType);
  if (category === 'annual') return 'Annually';
  if (category === 'standingOrder' || category === 'deductionDebit') {
    return 'Monthly';
  }
  return '';
};

const normalizeMatchKey = (value: any) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

export const findWorkLocationLookupItem = (
  workLocation?: string,
  workLocationLookups: any[] = [],
) => {
  if (!workLocation || workLocation === 'other') return null;
  const target = normalizeMatchKey(workLocation);

  return (
    (workLocationLookups || []).find((item: any) => {
      const lookup = item?.lookup || item || {};
      const names = [
        lookup.DisplayName,
        lookup.lookupname,
        lookup.name,
        item?.DisplayName,
        item?.lookupname,
        item?.name,
        item?.label,
      ]
        .filter(Boolean)
        .map(normalizeMatchKey);
      const ids = [
        lookup._id,
        lookup.id,
        item?._id,
        item?.id,
      ]
        .filter(Boolean)
        .map(String);
      return (
        names.includes(target) ||
        ids.some(id => id === String(workLocation))
      );
    }) || null
  );
};

export const getBranchRegionFromLookupItem = (item: any) => {
  if (!item) return { branch: '', region: '' };

  // Portal: { lookup, branch: { lookupname }, region: { lookupname } }
  // CRM format=simple: { type: 'workLocation', branch: { name, region: { name } } }
  const branch =
    item?.branch?.DisplayName ||
    item?.branch?.lookupname ||
    item?.branch?.name ||
    item?.lookup?.branch?.DisplayName ||
    item?.lookup?.branch?.lookupname ||
    item?.lookup?.branch?.name ||
    (item?.Parentlookupid && typeof item.Parentlookupid === 'object'
      ? item.Parentlookupid.lookupname ||
        item.Parentlookupid.DisplayName ||
        item.Parentlookupid.name
      : '') ||
    item?.Parentlookup ||
    '';

  const region =
    item?.region?.DisplayName ||
    item?.region?.lookupname ||
    item?.region?.name ||
    item?.branch?.region?.DisplayName ||
    item?.branch?.region?.lookupname ||
    item?.branch?.region?.name ||
    item?.lookup?.region?.DisplayName ||
    item?.lookup?.region?.lookupname ||
    item?.lookup?.region?.name ||
    (item?.branch?.Parentlookupid &&
    typeof item.branch.Parentlookupid === 'object'
      ? item.branch.Parentlookupid.lookupname ||
        item.branch.Parentlookupid.DisplayName ||
        item.branch.Parentlookupid.name
      : '') ||
    '';

  return {
    branch: String(branch || '').trim(),
    region: String(region || '').trim(),
  };
};

export const workLocationAllowsSalaryDeduction = (
  workLocation?: string,
  workLocationLookups: any[] = [],
) => {
  const selected = findWorkLocationLookupItem(
    workLocation,
    workLocationLookups,
  );
  if (!selected) return false;
  const lookup = selected.lookup || selected;
  return lookup.processSalaryDeduction === true;
};
