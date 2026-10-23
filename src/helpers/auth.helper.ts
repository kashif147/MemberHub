import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/config';
import {
  PKCE_STATE_KEY,
  PKCE_STORAGE_KEY,
} from '../constants/azureAd';
import type { AuthUser } from '../store/initialState';

const PKCE_REDIRECT_URI_KEY = 'memberhub_pkce_redirect_uri';

export const setBearerToken = async (token: string) => {
  await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
};

export const getBearerToken = async () =>
  AsyncStorage.getItem(STORAGE_KEYS.TOKEN);

export const setRefreshToken = async (token: string) => {
  await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
};

export const getRefreshToken = async () =>
  AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

export const saveUser = async (user: AuthUser) => {
  await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
};

export const getSavedUser = async (): Promise<AuthUser | null> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const clearAuthStorage = async () => {
  await Promise.all([
    AsyncStorage.removeItem(STORAGE_KEYS.TOKEN),
    AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
    AsyncStorage.removeItem(STORAGE_KEYS.USER),
    AsyncStorage.removeItem(STORAGE_KEYS.LOGIN),
    AsyncStorage.removeItem(PKCE_STORAGE_KEY),
    AsyncStorage.removeItem(PKCE_STATE_KEY),
    AsyncStorage.removeItem(PKCE_REDIRECT_URI_KEY),
  ]);
};

export const setLoginFlag = async (value: boolean) => {
  await AsyncStorage.setItem(STORAGE_KEYS.LOGIN, value ? 'true' : 'false');
};
