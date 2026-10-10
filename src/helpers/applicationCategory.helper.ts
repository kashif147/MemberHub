export const CATEGORY_DISPLAY_NAME_BY_TYPE = {
  undergraduate_student: 'Undergraduate Student',
  retired_associate: 'Retired Associate',
  postgraduate_student: 'Postgraduate Student',
  general: 'General (all grades)',
  private_nursing_home: 'Private nursing home',
  short_term_relief: 'Short-term/Relief (under 12 hrs/wk average)',
  associate: 'Associate (not currently employed as a nurse/midwife)',
  affiliate: 'Affiliate members (non-practicing)',
  lecturing: 'Lecturing (employed in universities and IT institutes)',
} as const;

export const isUndergraduateStudentCategory = (membershipCategory?: string) => {
  if (!membershipCategory) return false;
  const s = String(membershipCategory);
  return (
    s === CATEGORY_DISPLAY_NAME_BY_TYPE.undergraduate_student ||
    s === 'undergraduate_student' ||
    s.toLowerCase() === 'undergraduate student'
  );
};

export const isRetiredAssociateCategory = (membershipCategory?: string) => {
  if (!membershipCategory) return false;
  const s = String(membershipCategory);
  return (
    s === CATEGORY_DISPLAY_NAME_BY_TYPE.retired_associate ||
    s === 'retired_associate' ||
    s.toLowerCase().includes('retired associate') ||
    (s.toLowerCase().includes('retired') && !s.toLowerCase().includes('student'))
  );
};

export const isReducedRateMembershipCategory = (membershipCategory?: string) => {
  if (!membershipCategory) return false;
  const s = String(membershipCategory).toLowerCase();
  return (
    s.includes('short-term') ||
    s.includes('relief') ||
    s.includes('associate') ||
    s.includes('affiliate') ||
    s.includes('private nursing')
  );
};
