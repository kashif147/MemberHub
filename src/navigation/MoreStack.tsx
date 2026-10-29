import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MoreScreen from '../screens/MoreScreen';
import NotificationsScreen from '../modules/notifications/NotificationsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import MyDrivesScreen from '../modules/application/MyDrivesScreen';
import DriveDetailsScreen from '../modules/application/DriveDetailsScreen';
import CreateDriveScreen from '../modules/application/CreateDriveScreen';
import { STACKS } from '../enums/ScreenEnums';

export type MoreStackParamList = {
  [STACKS.MORE_MAIN]: undefined;
  [STACKS.NOTIFICATIONS]: undefined;
  [STACKS.SETTINGS]: undefined;
  [STACKS.MY_DRIVES]: undefined;
  [STACKS.DRIVE_DETAILS]: { driveId: string };
  [STACKS.CREATE_DRIVE]: undefined;
};

const Stack = createNativeStackNavigator<MoreStackParamList>();

const MoreStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name={STACKS.MORE_MAIN} component={MoreScreen} />
    <Stack.Screen
      name={STACKS.NOTIFICATIONS}
      component={NotificationsScreen}
    />
    <Stack.Screen name={STACKS.SETTINGS} component={SettingsScreen} />
    <Stack.Screen name={STACKS.MY_DRIVES} component={MyDrivesScreen} />
    <Stack.Screen name={STACKS.DRIVE_DETAILS} component={DriveDetailsScreen} />
    <Stack.Screen name={STACKS.CREATE_DRIVE} component={CreateDriveScreen} />
  </Stack.Navigator>
);

export default MoreStack;
