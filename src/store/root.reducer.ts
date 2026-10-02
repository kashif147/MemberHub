import { combineReducers } from '@reduxjs/toolkit';
import authReducer from './slice/auth.slice';

export const rootReducer = combineReducers({
  auth: authReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
