import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import TabNavigation from './TabNavigation';
import SplashScreen from '../modules/splash/SplashScreen';
import LandingPage from '../modules/landing/LandingPage';
import { validation } from '../services/auth.services';
import { useLookup } from '../contexts/lookupContext';
import { Colors } from '../theme/colors';
import type { AppDispatch, RootState } from '../store';

const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.background,
    card: Colors.surface,
    border: Colors.border,
    primary: Colors.primary,
    text: Colors.textPrimary,
  },
};

const MIN_SPLASH_MS = 1800;

/**
 * Root gate — same idea as Portal_App App.js:
 * splash while validating → Landing if signed out → tabs if signed in.
 */
const AppNavigator = () => {
  const dispatch = useDispatch<AppDispatch>();
  const isSignedIn = useSelector((s: RootState) => s.auth.isSignedIn);
  const isLoading = useSelector((s: RootState) => s.auth.isLoading);
  const { refreshLookups } = useLookup();
  const [minSplashDone, setMinSplashDone] = React.useState(false);

  useEffect(() => {
    dispatch(validation());
    const t = setTimeout(() => setMinSplashDone(true), MIN_SPLASH_MS);
    return () => clearTimeout(t);
  }, [dispatch]);

  // CRM ApplicationMgtDrawer loads lookups after auth — same here.
  useEffect(() => {
    if (isSignedIn) {
      refreshLookups();
    }
  }, [isSignedIn, refreshLookups]);

  if (isLoading || !minSplashDone) {
    return <SplashScreen />;
  }

  if (!isSignedIn) {
    return <LandingPage />;
  }

  return (
    <NavigationContainer theme={AppTheme}>
      <TabNavigation />
    </NavigationContainer>
  );
};

export default AppNavigator;
