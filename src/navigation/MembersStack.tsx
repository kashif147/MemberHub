import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MembersScreen from '../screens/MembersScreen';
import MemberDetailScreen from '../modules/members/MemberDetailScreen';
import { STACKS } from '../enums/ScreenEnums';

export type MembersStackParamList = {
  [STACKS.MEMBERS_LIST]: undefined;
  [STACKS.MEMBER_DETAIL]: { memberId: string };
};

const Stack = createNativeStackNavigator<MembersStackParamList>();

const MembersStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name={STACKS.MEMBERS_LIST} component={MembersScreen} />
    <Stack.Screen name={STACKS.MEMBER_DETAIL} component={MemberDetailScreen} />
  </Stack.Navigator>
);

export default MembersStack;
