import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import initialState, { AuthUser } from '../initialState';

export const authSlice = createSlice({
  name: 'auth',
  initialState: initialState.auth,
  reducers: {
    setSignedIn: (state, action: PayloadAction<boolean>) => {
      state.isSignedIn = action.payload;
      state.isLoading = false;
    },
    setUser: (state, action: PayloadAction<AuthUser | null>) => {
      state.user = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setDetail: (state, action: PayloadAction<AuthUser | null>) => {
      state.userDetail = action.payload;
    },
    signOut: state => {
      state.isSignedIn = false;
      state.isLoading = false;
      state.user = null;
      state.userDetail = null;
    },
  },
});

export const { setSignedIn, setUser, setLoading, setDetail, signOut } =
  authSlice.actions;

export default authSlice.reducer;
