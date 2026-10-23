import { jwtDecode } from 'jwt-decode';
import store from '../store';
import { signOut } from '../store/slice/auth.slice';
import { clearAuthStorage, getBearerToken } from './auth.helper';

/** Auth endpoints that return 401 on bad credentials — do not force logout. */
const AUTH_PATH_SKIP =
  /\/auth(\/|$)|\/pkce\//i;

let loggingOut = false;

export const isAuthRequestUrl = (url?: string) =>
  Boolean(url && AUTH_PATH_SKIP.test(url));

/**
 * True when the stored access token is a JWT past `exp`.
 * Encrypted or opaque tokens return false (unknown) — rely on API 401 instead.
 */
export const isAccessTokenExpired = (token?: string | null): boolean => {
  const raw = String(token || '').trim();
  if (!raw) return true;
  if (raw.includes(':') || raw.split('.').length < 3) return false;
  try {
    const { exp } = jwtDecode<{ exp?: number }>(raw);
    if (!exp) return false;
    // 5s clock skew
    return Date.now() >= exp * 1000 - 5000;
  } catch {
    return false;
  }
};

export const isUnauthorizedStatus = (status?: number) =>
  status === 401 || status === 403;

/**
 * Clear storage + Redux so the app returns to Landing.
 * Idempotent under concurrent 401s.
 */
export const forceLogoutOnExpiredSession = async (reason?: string) => {
  if (loggingOut) return;
  loggingOut = true;
  try {
    if (__DEV__ && reason) {
      // eslint-disable-next-line no-console
      console.warn('[session] force logout:', reason);
    }
    await clearAuthStorage();
    store.dispatch(signOut());
  } finally {
    setTimeout(() => {
      loggingOut = false;
    }, 1500);
  }
};

/**
 * Request interceptor: if JWT is already expired, logout and abort the request
 * so callers do not treat an empty/anonymous call as a normal API failure.
 */
export const rejectIfTokenExpired = async () => {
  const token = await getBearerToken();
  if (!token) return;
  if (isAccessTokenExpired(token)) {
    await forceLogoutOnExpiredSession('jwt_expired');
    const err: any = new Error('Session expired. Please sign in again.');
    err.isSessionExpired = true;
    err.code = 'SESSION_EXPIRED';
    throw err;
  }
};

/**
 * Response interceptor helper for validateStatus: () => true clients.
 * Returns true when a forced logout was triggered.
 */
export const handleUnauthorizedResponse = async (args: {
  status?: number;
  url?: string;
  message?: string;
}) => {
  if (!isUnauthorizedStatus(args.status)) return false;
  if (isAuthRequestUrl(args.url)) return false;

  const msg =
    String(args.message || '').toLowerCase() ||
    `http_${args.status}`;
  const looksExpired =
    msg.includes('expired') ||
    msg.includes('jwt') ||
    msg.includes('token') ||
    msg.includes('unauthorized') ||
    msg.includes('unauthenticated') ||
    args.status === 401 ||
    args.status === 403;

  if (!looksExpired) return false;

  await forceLogoutOnExpiredSession(msg);
  return true;
};
