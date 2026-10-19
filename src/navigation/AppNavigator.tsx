import React, { useCallback, useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import TabNavigation from './TabNavigation';
import SplashScreen from '../modules/splash/SplashScreen';
import OnboardingScreen from '../modules/onboarding/OnboardingScreen';
import LandingPage from '../modules/landing/LandingPage';
import { validation } from '../services/auth.services';
import { useLookup } from '../contexts/lookupContext';
import { STORAGE_KEYS } from '../constants/config';
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
 * Root gate: splash → onboarding (first launch) → Landing if signed out → tabs.
 */
const AppNavigator = () => {
  const dispatch = useDispatch<AppDispatch>();
  const isSignedIn = useSelector((s: RootState) => s.auth.isSignedIn);
  const isLoading = useSelector((s: RootState) => s.auth.isLoading);
  const { refreshLookups } = useLookup();
  const [minSplashDone, setMinSplashDone] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    dispatch(validation());
    const t = setTimeout(() => setMinSplashDone(true), MIN_SPLASH_MS);
    return () => clearTimeout(t);
  }, [dispatch]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const done = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_DONE);
        if (!cancelled) {
          setShowOnboarding(done !== 'true');
        }
      } finally {
        if (!cancelled) {
          setOnboardingChecked(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isSignedIn) {
      refreshLookups();
    }
  }, [isSignedIn, refreshLookups]);

  const finishOnboarding = useCallback(async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_DONE, 'true');
    setShowOnboarding(false);
  }, []);

  if (isLoading || !minSplashDone || !onboardingChecked) {
    return <SplashScreen />;
  }

  if (!isSignedIn && showOnboarding) {
    return <OnboardingScreen onFinished={finishOnboarding} />;
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
