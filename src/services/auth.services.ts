import { jwtDecode } from 'jwt-decode';
import { AppDispatch } from '../store';
import {
  setDetail,
  setLoading,
  setSignedIn,
  setUser,
  signOut as signOutAction,
} from '../store/slice/auth.slice';
import {
  clearAuthStorage,
  getBearerToken,
  getSavedUser,
  saveUser,
  setBearerToken,
  setLoginFlag,
  setRefreshToken,
} from '../helpers/auth.helper';
import {
  forceLogoutOnExpiredSession,
  isAccessTokenExpired,
  isUnauthorizedStatus,
} from '../helpers/sessionExpiry.helper';
import {
  signInAzureCrmRequest,
  signInCredentialsRequest,
  validationRequest,
} from '../api/auth.api';
import { clearPkce, getPkceRedirectUri } from '../helpers/microsoftAuth.helper';
import { decryptCrmAccessToken } from '../helpers/tokenDecrypt.helper';
import { extractLocationScopeFromMe } from '../helpers/meLocation.helper';
import type { AuthUser } from '../store/initialState';

const DEMO_OFFICER: AuthUser = {
  id: 'bo-demo',
  name: 'Kashif Rehman',
  email: 'kashif.rehman@example.com',
  memberNo: 'B00002',
  role: 'Branch Officer',
  branches: 'Beaumont & Mater branches',
  initials: 'KR',
};

export const validation = () => async (dispatch: AppDispatch) => {
  dispatch(setLoading(true));
  try {
    const token = await getBearerToken();
    const saved = await getSavedUser();

    if (!token) {
      if (saved) {
        await clearAuthStorage();
      }
      dispatch(signOutAction());
      return;
    }

    if (isAccessTokenExpired(token)) {
      await forceLogoutOnExpiredSession('validation_jwt_expired');
      return;
    }

    try {
      const res = await validationRequest();
      if (res?.status === 200 && res?.data) {
        const me = mapMeToUser(res.data);
        await saveUser(me);
        dispatch(setUser(me));
        dispatch(setDetail(me));
        dispatch(setSignedIn(true));
        return;
      }

      // Expired / invalid session — do not keep the user "logged in" offline.
      if (isUnauthorizedStatus(res?.status)) {
        await forceLogoutOnExpiredSession(`validation_http_${res?.status}`);
        return;
      }
    } catch (e: any) {
      if (e?.isSessionExpired || e?.code === 'SESSION_EXPIRED') {
        return;
      }
      // Token cleared by interceptor while this call was in flight.
      const stillHasToken = await getBearerToken();
      if (!stillHasToken) {
        return;
      }
      // Network failure only — allow cached session below.
    }

    if (saved) {
      dispatch(setUser(saved));
      dispatch(setDetail(saved));
      dispatch(setSignedIn(true));
      return;
    }

    // Token present — try JWT claims
    const fromJwt = userFromJwt(token);
    if (fromJwt) {
      dispatch(setUser(fromJwt));
      dispatch(setDetail(fromJwt));
      dispatch(setSignedIn(true));
      return;
    }

    await forceLogoutOnExpiredSession('validation_no_user');
  } finally {
    dispatch(setLoading(false));
  }
};

const mapMeToUser = (payload: any): AuthUser => {
  const data = payload?.data?.data ?? payload?.data ?? payload;
  const name =
    data?.name ||
    data?.userFullName ||
    [data?.firstName, data?.lastName].filter(Boolean).join(' ') ||
    data?.userName ||
    data?.preferred_username ||
    'Branch Officer';
  const initials = String(name)
    .split(' ')
    .map((p: string) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const location = extractLocationScopeFromMe(payload);

  return {
    id: data?.id || data?.userId || data?.sub || data?._id,
    name,
    email: data?.email || data?.userEmail || data?.preferred_username,
    memberNo: data?.memberNo || data?.membershipNumber || data?.userCode,
    role:
      (Array.isArray(data?.roles) &&
        (typeof data.roles[0] === 'string'
          ? data.roles[0]
          : data.roles[0]?.name || data.roles[0]?.code)) ||
      data?.role ||
      'Branch Officer',
    branches: location.scopeLabel,
    initials,
    workLocations: location.workLocations,
    workLocationRows: location.workLocationRows,
    branchFilters: location.branches,
    regionFilters: location.regions,
  };
};

/** After Azure/credentials token is stored — load /api/me for location scope. */
const fetchAndApplyMe = async (
  dispatch: AppDispatch,
  fallback?: AuthUser | null,
) => {
  try {
    const res = await validationRequest();
    if (res?.status === 200 && res?.data) {
      const me = mapMeToUser(res.data);
      await saveUser(me);
      dispatch(setUser(me));
      dispatch(setDetail(me));
      return me;
    }
  } catch {
    // keep fallback
  }
  if (fallback) {
    await saveUser(fallback);
    dispatch(setUser(fallback));
    dispatch(setDetail(fallback));
  }
  return fallback || null;
};

/** Re-fetch /api/me (e.g. Members screen when assignedLocations missing from cache). */
export const refreshMeProfile = () => async (dispatch: AppDispatch) => {
  const token = await getBearerToken();
  if (!token) return null;
  return fetchAndApplyMe(dispatch, null);
};

const userFromJwt = (token: string): AuthUser | null => {
  try {
    if (!token || token.includes(':') || token.split('.').length < 3) {
      return null;
    }
    const decode: any = jwtDecode(token);
    return mapMeToUser(decode);
  } catch {
    return null;
  }
};

/**
 * Resolve + decrypt CRM access token from /auth/azure-crm response
 * (same as ProjectShell-1 Login.handleAuthRedirect).
 */
const resolveAccessToken = async (data: any): Promise<string | null> => {
  const raw =
    data?.accessToken ||
    data?.token ||
    data?.data?.accessToken ||
    data?.data?.token ||
    null;
  if (typeof raw !== 'string' || raw.length === 0) {
    return null;
  }
  try {
    return await decryptCrmAccessToken(raw);
  } catch {
    // Plain JWT or already usable bearer
    if (raw.split('.').length === 3) {
      return raw.replace(/^Bearer\s+/i, '');
    }
    throw new Error('Unable to decrypt CRM access token');
  }
};

export const signInAsBranchOfficer =
  () => async (dispatch: AppDispatch) => {
    dispatch(setLoading(true));
    try {
      await setBearerToken(`demo_bo_${Date.now()}`);
      await saveUser(DEMO_OFFICER);
      await setLoginFlag(true);
      dispatch(setUser(DEMO_OFFICER));
      dispatch(setDetail(DEMO_OFFICER));
      dispatch(setSignedIn(true));
    } finally {
      dispatch(setLoading(false));
    }
  };

export const signInWithCredentials =
  (username: string, password: string) => async (dispatch: AppDispatch) => {
    dispatch(setLoading(true));
    try {
      const res = await signInCredentialsRequest({ username, password });
      if (res?.status !== 200) {
        throw new Error(res?.data?.message || 'Unable to sign in');
      }

      const token = await resolveAccessToken(res.data);
      if (!token) {
        throw new Error('No access token returned');
      }

      await setBearerToken(token);
      await setLoginFlag(true);

      const fallback = userFromJwt(token) || mapMeToUser(res.data);
      await fetchAndApplyMe(dispatch, fallback);
      dispatch(setSignedIn(true));
      return { ok: true as const };
    } catch (err: any) {
      return { ok: false as const, message: err?.message || 'Sign in failed' };
    } finally {
      dispatch(setLoading(false));
    }
  };

/** Pull a readable message from CRM error envelopes (nested `error.message`). */
const extractApiErrorMessage = (data: any, fallback: string) => {
  if (!data) return fallback;
  if (typeof data === 'string') return data;
  if (typeof data?.error?.message === 'string') return data.error.message;
  if (typeof data?.message === 'string') return data.message;
  if (typeof data?.error === 'string') return data.error;
  return fallback;
};

/**
 * Microsoft SSO — Portal_App pattern against CRM endpoint:
 * POST /auth/azure-crm { code, codeVerifier, state }
 * (state must come from GET /pkce/generate → authorizationUrls.azureAD)
 */
export const signInWithMicrosoft =
  (payload: {
    code: string;
    codeVerifier: string;
    state?: string | null;
  }) =>
  async (dispatch: AppDispatch) => {
    dispatch(setLoading(true));
    try {
      if (!payload.state) {
        throw new Error('Missing OAuth state. Please try signing in again.');
      }

      const redirectUri = (await getPkceRedirectUri()) || undefined;
      const res = await signInAzureCrmRequest({
        code: payload.code,
        codeVerifier: payload.codeVerifier,
        state: payload.state,
        redirectUri,
      });

      if (res?.status !== 200) {
        const msg = extractApiErrorMessage(
          res?.data,
          `Authentication failed (${res?.status || 'network'})`,
        );
        throw new Error(msg);
      }

      const token = await resolveAccessToken(res.data);
      if (!token) {
        throw new Error('No access token returned from CRM');
      }

      await setBearerToken(token);
      if (res?.data?.refresh_token) {
        await setRefreshToken(res.data.refresh_token);
      }
      await setLoginFlag(true);
      await clearPkce();

      // /api/me supplies workLocation / branch / region for Members filter
      const fallback = userFromJwt(token) || mapMeToUser(res.data) || DEMO_OFFICER;
      await fetchAndApplyMe(dispatch, fallback);
      dispatch(setSignedIn(true));
      return { ok: true as const };
    } catch (err: any) {
      return {
        ok: false as const,
        message: err?.message || 'Microsoft sign-in failed',
      };
    } finally {
      dispatch(setLoading(false));
    }
  };

export const signOut = () => async (dispatch: AppDispatch) => {
  await clearAuthStorage();
  await clearPkce();
  dispatch(signOutAction());
};
