import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MoreScreen from '../screens/MoreScreen';
import NotificationsScreen from '../modules/notifications/NotificationsScreen';
import { STACKS } from '../enums/ScreenEnums';

export type MoreStackParamList = {
  [STACKS.MORE_MAIN]: undefined;
  [STACKS.NOTIFICATIONS]: undefined;
};

const Stack = createNativeStackNavigator<MoreStackParamList>();

const MoreStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name={STACKS.MORE_MAIN} component={MoreScreen} />
    <Stack.Screen
      name={STACKS.NOTIFICATIONS}
      component={NotificationsScreen}
    />
  </Stack.Navigator>
);

export default MoreStack;
