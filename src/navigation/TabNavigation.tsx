import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Home,
  Users,
  Folder,
  Menu,
  Plus,
} from 'lucide-react-native';
import HomeStack from './HomeStack';
import MembersStack from './MembersStack';
import CasesStack from './CasesStack';
import MoreScreen from '../screens/MoreScreen';
import CreateSheet from '../components/CreateSheet';
import { Colors, FontFamily, Radii } from '../theme';
import { STACKS } from '../enums/ScreenEnums';

const Tab = createBottomTabNavigator();

type IconProps = { color: string; focused: boolean };

const HomeIcon = ({ color }: IconProps) => (
  <Home size={22} color={color} strokeWidth={2.2} />
);
const MembersIcon = ({ color }: IconProps) => (
  <Users size={22} color={color} strokeWidth={2.2} />
);
const CasesIcon = ({ color }: IconProps) => (
  <Folder size={22} color={color} strokeWidth={2.2} />
);
const MoreIcon = ({ color }: IconProps) => (
  <Menu size={22} color={color} strokeWidth={2.2} />
);

function CustomTabBar({ state, navigation }: any) {
  const [createVisible, setCreateVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 8);

  const tabs = [
    { name: STACKS.HOME, label: 'Home', Icon: HomeIcon },
    { name: STACKS.MEMBERS, label: 'Members', Icon: MembersIcon },
    { name: STACKS.CASES, label: 'Cases', Icon: CasesIcon },
    { name: STACKS.MORE, label: 'More', Icon: MoreIcon },
  ];

  const renderTab = (routeIndex: number, cfgIndex: number) => {
    const route = state.routes[routeIndex];
    const cfg = tabs[cfgIndex];
    if (!route || !cfg) return null;

    const isFocused = state.index === routeIndex;
    const { label, Icon } = cfg;
    const color = isFocused ? Colors.tabBarActive : Colors.tabBarInactive;

    return (
      <TouchableOpacity
        key={route.key}
        style={styles.tabItem}
        onPress={() => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        }}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        accessibilityLabel={label}>
        <Icon color={color} focused={isFocused} />
        <Text
          style={[
            styles.tabLabel,
            {
              color,
              fontFamily: isFocused ? FontFamily.medium : FontFamily.regular,
            },
          ]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <View style={[styles.tabBar, { paddingBottom: bottomPad }]}>
        {/* Left: Home, Members */}
        {renderTab(0, 0)}
        {renderTab(1, 1)}

        {/* Center FAB — Create */}
        <TouchableOpacity
          style={styles.fabWrapper}
          onPress={() => setCreateVisible(true)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Create">
          <View style={styles.fab}>
            <Plus size={26} color={Colors.primary} strokeWidth={2.4} />
          </View>
        </TouchableOpacity>

        {/* Right: Cases, More */}
        {renderTab(2, 2)}
        {renderTab(3, 3)}
      </View>

      <CreateSheet
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        onNewCase={() => {
          navigation.navigate(STACKS.CASES, {
            screen: STACKS.NEW_CASE,
          });
        }}
        onRegisterMember={() => {
          navigation.navigate(STACKS.HOME, {
            screen: STACKS.MEMBERSHIP_DRIVE,
          });
        }}
        onNewDrive={() => {
          navigation.navigate(STACKS.HOME, {
            screen: STACKS.CREATE_DRIVE,
          });
        }}
      />
    </>
  );
}

/** Exact mockup nav: Home · Members · (+) · Cases · More */
const TabNavigation = () => (
  <Tab.Navigator
    tabBar={props => <CustomTabBar {...props} />}
    screenOptions={{
      headerShown: false,
      tabBarHideOnKeyboard: true,
    }}>
    <Tab.Screen name={STACKS.HOME} component={HomeStack} />
    <Tab.Screen name={STACKS.MEMBERS} component={MembersStack} />
    <Tab.Screen name={STACKS.CASES} component={CasesStack} />
    <Tab.Screen name={STACKS.MORE} component={MoreScreen} />
  </Tab.Navigator>
);

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.tabBar,
    borderTopWidth: 1,
    borderTopColor: Colors.tabBarBorder,
    paddingTop: 8,
    paddingHorizontal: 4,
    alignItems: 'flex-end',
    minHeight: 56,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingBottom: 2,
  },
  tabLabel: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
  },
  fabWrapper: {
    width: 68,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
    marginBottom: 2,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: Radii.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#292B31',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
});

export default TabNavigation;
