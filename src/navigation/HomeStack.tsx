import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import MembershipDriveScreen from '../modules/application/MembershipDriveScreen';
import ApplicationScreen from '../modules/application/ApplicationScreen';
import { STACKS } from '../enums/ScreenEnums';

export type HomeStackParamList = {
  [STACKS.HOME_MAIN]: undefined;
  [STACKS.MEMBERSHIP_DRIVE]: undefined;
  [STACKS.APPLICATION_FORM]: { driveName?: string };
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name={STACKS.HOME_MAIN} component={HomeScreen} />
    <Stack.Screen
      name={STACKS.MEMBERSHIP_DRIVE}
      component={MembershipDriveScreen}
    />
    <Stack.Screen
      name={STACKS.APPLICATION_FORM}
      component={ApplicationScreen}
    />
  </Stack.Navigator>
);

export default HomeStack;
