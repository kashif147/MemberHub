import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@memberhub/membership_drives';

export type MembershipDrive = {
  id: string;
  name: string;
  driveType: string;
  workLocations: string[];
  startDate: string;
  endDate: string;
  signUpTarget?: string;
  notes?: string;
  createdAt: string;
};

export const DRIVE_TYPE_OPTIONS = [
  'Workplace walkabout',
  'New graduates',
  'Stand at event',
  'Lapsed member outreach',
  'Online / remote',
] as const;

export const loadMembershipDrives = async (): Promise<MembershipDrive[]> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveMembershipDrive = async (
  drive: Omit<MembershipDrive, 'id' | 'createdAt'> & {
    id?: string;
    createdAt?: string;
  },
): Promise<MembershipDrive> => {
  const next: MembershipDrive = {
    id: drive.id || `drive_${Date.now()}`,
    name: drive.name.trim(),
    driveType: drive.driveType,
    workLocations: drive.workLocations || [],
    startDate: drive.startDate,
    endDate: drive.endDate,
    signUpTarget: drive.signUpTarget,
    notes: drive.notes,
    createdAt: drive.createdAt || new Date().toISOString(),
  };
  const existing = await loadMembershipDrives();
  const updated = [next, ...existing.filter(d => d.id !== next.id)];
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return next;
};

export const toIsoStartOfDay = (date = new Date()) => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return d.toISOString();
};

export const toIsoDaysFromNow = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toIsoStartOfDay(d);
};
