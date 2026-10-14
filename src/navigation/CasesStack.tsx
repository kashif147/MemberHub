import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CasesScreen from '../screens/CasesScreen';
import NewCaseScreen from '../modules/cases/NewCaseScreen';
import CaseDetailScreen from '../modules/cases/CaseDetailScreen';
import { STACKS } from '../enums/ScreenEnums';

export type CasesStackParamList = {
  [STACKS.CASES_LIST]: undefined;
  [STACKS.NEW_CASE]: undefined;
  [STACKS.CASE_DETAIL]: { issueId: string; title?: string };
};

const Stack = createNativeStackNavigator<CasesStackParamList>();

const CasesStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name={STACKS.CASES_LIST} component={CasesScreen} />
    <Stack.Screen name={STACKS.NEW_CASE} component={NewCaseScreen} />
    <Stack.Screen name={STACKS.CASE_DETAIL} component={CaseDetailScreen} />
  </Stack.Navigator>
);

export default CasesStack;
