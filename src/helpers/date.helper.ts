/** Date helpers — Portal_App date.helper without moment dependency. */

const parseParts = (dateStr?: string): Date | null => {
  if (!dateStr) return null;
  const raw = String(dateStr).trim();
  if (!raw) return null;

  if (/^\d{4}-\d{2}-\d{2}/.test(raw) || raw.includes('T')) {
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const m = raw.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (m) {
    const dd = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10);
    const yyyy = parseInt(m[3], 10);
    const d = new Date(yyyy, mm - 1, dd);
    if (
      d.getFullYear() !== yyyy ||
      d.getMonth() !== mm - 1 ||
      d.getDate() !== dd
    ) {
      return null;
    }
    return d;
  }
  return null;
};

/** Convert display/ISO date → ISO string for API (Portal isDataFormat). */
export const isDataFormat = (dateStr?: string): string | null => {
  const d = parseParts(dateStr);
  return d ? d.toISOString() : null;
};

export const formatToDDMMYYYY = (dateString?: string): string | null => {
  const d = parseParts(dateString);
  if (!d) return null;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = String(d.getFullYear());
  return `${dd}/${mm}/${yyyy}`;
};

export const calculateAgeFromDateOfBirth = (dateOfBirth?: string): number | null => {
  const dob = parseParts(dateOfBirth);
  if (!dob) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age -= 1;
  return age;
};

export const toApiDate = (value?: string): string | undefined => {
  const iso = isDataFormat(value);
  return iso || undefined;
};
