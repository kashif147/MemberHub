/**
 * Phone helpers aligned with Portal_App / projectShell-portal.
 * Normalize to E.164 for storage; split into country + national for UI.
 */

const countryCallingCode: Record<string, string> = {
  '1': 'US',
  '7': 'RU',
  '20': 'EG',
  '27': 'ZA',
  '30': 'GR',
  '31': 'NL',
  '32': 'BE',
  '33': 'FR',
  '34': 'ES',
  '36': 'HU',
  '39': 'IT',
  '40': 'RO',
  '41': 'CH',
  '43': 'AT',
  '44': 'GB',
  '45': 'DK',
  '46': 'SE',
  '47': 'NO',
  '48': 'PL',
  '49': 'DE',
  '51': 'PE',
  '52': 'MX',
  '53': 'CU',
  '54': 'AR',
  '55': 'BR',
  '56': 'CL',
  '57': 'CO',
  '58': 'VE',
  '60': 'MY',
  '61': 'AU',
  '62': 'ID',
  '63': 'PH',
  '64': 'NZ',
  '65': 'SG',
  '66': 'TH',
  '81': 'JP',
  '82': 'KR',
  '84': 'VN',
  '86': 'CN',
  '90': 'TR',
  '91': 'IN',
  '92': 'PK',
  '93': 'AF',
  '94': 'LK',
  '95': 'MM',
  '98': 'IR',
  '212': 'MA',
  '213': 'DZ',
  '216': 'TN',
  '218': 'LY',
  '220': 'GM',
  '221': 'SN',
  '222': 'MR',
  '223': 'ML',
  '224': 'GN',
  '225': 'CI',
  '226': 'BF',
  '227': 'NE',
  '228': 'TG',
  '229': 'BJ',
  '230': 'MU',
  '231': 'LR',
  '232': 'SL',
  '233': 'GH',
  '234': 'NG',
  '235': 'TD',
  '236': 'CF',
  '237': 'CM',
  '238': 'CV',
  '239': 'ST',
  '240': 'GQ',
  '241': 'GA',
  '242': 'CG',
  '243': 'CD',
  '244': 'AO',
  '245': 'GW',
  '246': 'IO',
  '248': 'SC',
  '249': 'SD',
  '250': 'RW',
  '251': 'ET',
  '252': 'SO',
  '253': 'DJ',
  '254': 'KE',
  '255': 'TZ',
  '256': 'UG',
  '257': 'BI',
  '258': 'MZ',
  '260': 'ZM',
  '261': 'MG',
  '262': 'RE',
  '263': 'ZW',
  '264': 'NA',
  '265': 'MW',
  '266': 'LS',
  '267': 'BW',
  '268': 'SZ',
  '269': 'KM',
  '290': 'SH',
  '291': 'ER',
  '297': 'AW',
  '298': 'FO',
  '299': 'GL',
  '350': 'GI',
  '351': 'PT',
  '352': 'LU',
  '353': 'IE',
  '354': 'IS',
  '356': 'MT',
  '357': 'CY',
  '358': 'FI',
  '359': 'BG',
  '370': 'LT',
  '371': 'LV',
  '372': 'EE',
  '373': 'MD',
  '374': 'AM',
  '375': 'BY',
  '376': 'AD',
  '377': 'MC',
  '378': 'SM',
  '380': 'UA',
  '381': 'RS',
  '382': 'ME',
  '383': 'XK',
  '385': 'HR',
  '386': 'SI',
  '387': 'BA',
  '389': 'MK',
  '420': 'CZ',
  '421': 'SK',
  '423': 'LI',
};

export const DEFAULT_COUNTRY = {
  cca2: 'IE',
  callingCode: '353',
};

export const allowedCountryCodes = [
  'IE', 'US', 'GB', 'CA', 'AU', 'NZ', 'IN', 'PK', 'CN', 'JP', 'KR',
  'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'CH', 'AT', 'SE', 'NO', 'DK',
  'FI', 'PL', 'PT', 'GR', 'CZ', 'HU', 'RO', 'BG', 'HR', 'SI', 'MX',
  'BR', 'AR', 'CL', 'CO', 'PE', 'VE', 'MY', 'SG', 'TH', 'PH', 'ID',
  'VN', 'TR', 'EG', 'ZA', 'MA', 'NG', 'KE', 'GH', 'TZ', 'UG',
];

const sortedCallingCodes = Object.keys(countryCallingCode).sort(
  (a, b) => b.length - a.length,
);

const toDigits = (value: any) => String(value || '').replace(/\D/g, '');

const detectCallingCodeFromDigits = (digits: string) => {
  if (!digits) return null;
  for (const callingCode of sortedCallingCodes) {
    if (!digits.startsWith(callingCode)) continue;
    const cca2 = countryCallingCode[callingCode];
    const nationalNumber = digits.slice(callingCode.length);
    if (!nationalNumber || nationalNumber.length < 6 || nationalNumber.length > 15) {
      continue;
    }
    if (callingCode === '1' && nationalNumber.length !== 10) continue;
    return { callingCode, nationalNumber, cca2 };
  }
  return null;
};

export const normalizeMobileToE164 = (
  mobileNo?: string,
  defaultCountry = 'IE',
) => {
  const raw = String(mobileNo || '').trim();
  if (!raw) return '';

  if (raw.startsWith('+')) {
    const digits = toDigits(raw);
    const detected = detectCallingCodeFromDigits(digits);
    if (detected?.callingCode === '353' && detected.nationalNumber) {
      const nested = detectCallingCodeFromDigits(detected.nationalNumber);
      if (nested && nested.callingCode !== '353') {
        return `+${nested.callingCode}${nested.nationalNumber}`;
      }
    }
    return raw.replace(/\s+/g, '');
  }

  const digits = toDigits(raw);
  if (!digits) return '';
  if (digits.startsWith('00')) return `+${digits.slice(2)}`;

  const detected = detectCallingCodeFromDigits(digits);
  if (detected) return `+${detected.callingCode}${detected.nationalNumber}`;
  if (digits.startsWith('353')) return `+${digits}`;
  if (defaultCountry === 'IE' && digits.startsWith('08')) {
    return `+353${digits.slice(1)}`;
  }
  if (
    defaultCountry === 'IE' &&
    digits.startsWith('8') &&
    digits.length >= 9 &&
    digits.length <= 10
  ) {
    return `+353${digits}`;
  }
  if (digits.startsWith('0')) return digits;
  return `+${digits}`;
};

export const splitMobileNumber = (
  mobileNo?: string,
  defaultCountry = DEFAULT_COUNTRY,
) => {
  const raw = String(mobileNo || '').trim();
  if (!raw) {
    return {
      cca2: defaultCountry.cca2,
      callingCode: defaultCountry.callingCode,
      nationalNumber: '',
    };
  }

  const normalized = normalizeMobileToE164(raw);
  const digits = toDigits(normalized.startsWith('+') ? normalized : raw);
  let detected = detectCallingCodeFromDigits(digits);

  if (detected?.callingCode === '353' && detected.nationalNumber) {
    const nested = detectCallingCodeFromDigits(detected.nationalNumber);
    if (nested && nested.callingCode !== '353') detected = nested;
  }

  if (detected) {
    return {
      cca2: detected.cca2,
      callingCode: detected.callingCode,
      nationalNumber: detected.nationalNumber,
    };
  }

  let nationalNumber = digits;
  if (nationalNumber.startsWith('0')) nationalNumber = nationalNumber.slice(1);

  return {
    cca2: defaultCountry.cca2,
    callingCode: defaultCountry.callingCode,
    nationalNumber,
  };
};

export const buildMobileE164 = (
  callingCode?: string,
  nationalNumber?: string,
) => {
  const code = String(callingCode || '').replace(/\D/g, '');
  const national = toDigits(nationalNumber);
  if (!code || !national) return '';
  return `+${code}${national}`;
};

export const isValidMobileE164 = (
  mobileNo?: string,
  defaultCountry = 'IE',
) => {
  const e164 = normalizeMobileToE164(mobileNo, defaultCountry);
  if (!e164 || !e164.startsWith('+')) return false;
  const split = splitMobileNumber(e164);
  return Boolean(split.nationalNumber && split.nationalNumber.length >= 6);
};
