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
} from '../helpers/auth.helper';
import { signInCredentialsRequest, validationRequest } from '../api/auth.api';
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

/** Bootstrap session on app start (Portal_App validation pattern). */
export const validation = () => async (dispatch: AppDispatch) => {
  dispatch(setLoading(true));
  try {
    const token = await getBearerToken();
    const saved = await getSavedUser();

    if (!token) {
      dispatch(setSignedIn(false));
      return;
    }

    // Prefer live /api/me when CRM is reachable; fall back to cached user.
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
    } catch {
      // offline / API not wired yet
    }

    if (saved) {
      dispatch(setUser(saved));
      dispatch(setDetail(saved));
      dispatch(setSignedIn(true));
      return;
    }

    dispatch(setSignedIn(false));
  } finally {
    dispatch(setLoading(false));
  }
};

const mapMeToUser = (payload: any): AuthUser => {
  const data = payload?.data?.data ?? payload?.data ?? payload;
  const name =
    data?.name ||
    [data?.firstName, data?.lastName].filter(Boolean).join(' ') ||
    data?.userName ||
    'Branch Officer';
  const initials = name
    .split(' ')
    .map((p: string) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return {
    id: data?.id || data?.userId,
    name,
    email: data?.email || data?.userEmail,
    memberNo: data?.memberNo || data?.membershipNumber || data?.userCode,
    role: data?.role || data?.roles?.[0] || 'Branch Officer',
    branches: data?.branches || data?.scope || 'Assigned branches',
    initials,
  };
};

/**
 * Demo / offline Branch Officer sign-in for UI development.
 * Replace with Microsoft CRM SSO when backend mobile PKCE is ready.
 */
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

/** Credential login against CRM /auth (ProjectShell-1 compatible). */
export const signInWithCredentials =
  (username: string, password: string) => async (dispatch: AppDispatch) => {
    dispatch(setLoading(true));
    try {
      const res = await signInCredentialsRequest({ username, password });
      if (res?.status !== 200) {
        throw new Error(res?.data?.message || 'Unable to sign in');
      }

      const token =
        res?.data?.accessToken ||
        res?.data?.token ||
        res?.data?.data?.accessToken ||
        res?.data?.data?.token;

      if (!token) {
        throw new Error('No access token returned');
      }

      await setBearerToken(token);
      await setLoginFlag(true);

      const user = mapMeToUser(res.data);
      await saveUser(user);
      dispatch(setUser(user));
      dispatch(setDetail(user));
      dispatch(setSignedIn(true));
      return { ok: true };
    } catch (err: any) {
      dispatch(setLoading(false));
      return { ok: false, message: err?.message || 'Sign in failed' };
    } finally {
      dispatch(setLoading(false));
    }
  };

export const signOut = () => async (dispatch: AppDispatch) => {
  await clearAuthStorage();
  dispatch(signOutAction());
};
