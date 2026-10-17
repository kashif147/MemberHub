/** Shared helpers for application subscription payment (Portal-aligned). */

export const findCategoryProductByName = (
  products: any[],
  membershipCategory?: string,
) => {
  const target = String(membershipCategory || '')
    .trim()
    .toLowerCase();
  if (!target) return null;
  return (
    (products || []).find((p: any) => {
      const name = String(p?.name || p?.DisplayName || p?.label || '')
        .trim()
        .toLowerCase();
      return name === target;
    }) || null
  );
};

export const resolveMemberEmailFromPersonal = (
  personal: Record<string, any> = {},
) => {
  const preferred = String(personal?.preferredEmail || '').toLowerCase();
  if (preferred === 'work' && personal?.workEmail) {
    return String(personal.workEmail).trim();
  }
  if (personal?.personalEmail) return String(personal.personalEmail).trim();
  if (personal?.workEmail) return String(personal.workEmail).trim();
  return '';
};
