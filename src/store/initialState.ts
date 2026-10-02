export type AuthUser = {
  id?: string;
  name?: string;
  email?: string;
  memberNo?: string;
  role?: string;
  branches?: string;
  initials?: string;
};

export type AuthState = {
  isSignedIn: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  userDetail: AuthUser | null;
};

const initialState = {
  auth: {
    isSignedIn: false,
    isLoading: true,
    user: null,
    userDetail: null,
  } as AuthState,
};

export default initialState;
