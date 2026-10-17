export type AuthUser = {
  id?: string;
  name?: string;
  email?: string;
  memberNo?: string;
  role?: string;
  /** Display label for header / scope card */
  branches?: string;
  initials?: string;
  /** From /me — used to filter subscription members */
  workLocations?: string[];
  /** From /me assignedLocations — name + branch/region per site */
  workLocationRows?: {
    name: string;
    branch: string;
    region: string;
  }[];
  branchFilters?: string[];
  regionFilters?: string[];
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
