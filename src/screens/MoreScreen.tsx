import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import {
  Megaphone,
  Bell,
  ArrowLeftRight,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { Header } from '../components/Header';
import { signOut } from '../services/auth.services';
import { fetchMyDrivesGrouped } from '../services/membershipDrive.services';
import { STACKS } from '../enums/ScreenEnums';
import type { MoreStackParamList } from '../navigation/MoreStack';
import type { AppDispatch, RootState } from '../store';

type MenuItem = {
  key: string;
  label: string;
  Icon: React.ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>;
};

const MENU_ITEMS: MenuItem[] = [
  { key: 'drives', label: 'My drives', Icon: Megaphone },
  { key: 'notifications', label: 'Notifications', Icon: Bell },
  { key: 'memberApp', label: 'Open member app', Icon: ArrowLeftRight },
  { key: 'settings', label: 'Settings', Icon: Settings },
];

const MenuRow = ({
  label,
  Icon,
  last,
  onPress,
  badge,
}: {
  label: string;
  Icon: MenuItem['Icon'];
  last?: boolean;
  onPress?: () => void;
  badge?: string | null;
}) => (
  <TouchableOpacity
    style={[styles.menuRow, last && styles.menuRowLast]}
    activeOpacity={0.7}
    onPress={onPress}
    disabled={!onPress}>
    <View style={styles.menuLeft}>
      <View style={styles.menuIconWrap}>
        <Icon size={18} color={Colors.primary} strokeWidth={2.1} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      {badge ? (
        <View style={styles.liveBadge}>
          <Text style={styles.liveBadgeText}>{badge}</Text>
        </View>
      ) : null}
    </View>
    <ChevronRight size={18} color={Colors.textMuted} strokeWidth={2} />
  </TouchableOpacity>
);

const MoreScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((s: RootState) => s.auth.user);
  const [liveCount, setLiveCount] = useState(0);

  const name = user?.name || 'Kashif Rehman';
  const initials =
    user?.initials ||
    name
      .split(' ')
      .map(p => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  const memberNo = user?.memberNo || 'B00002';
  const role = user?.role || 'Branch Officer';
  const branches = user?.branches || 'Beaumont & Mater branches';
  const workLocations = user?.workLocations || [];
  const scopeSubtitle =
    workLocations.length > 0
      ? workLocations.join(', ')
      : '8 members · set by your rep role in the CRM';

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      fetchMyDrivesGrouped()
        .then(result => {
          if (!cancelled) setLiveCount(result.liveCount);
        })
        .catch(() => {
          if (!cancelled) setLiveCount(0);
        });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const onSignOut = () => {
    Alert.alert('Sign out', 'End your MemberHub session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => dispatch(signOut()),
      },
    ]);
  };

  const onMenuPress = (key: string) => {
    if (key === 'notifications') {
      navigation.navigate(STACKS.NOTIFICATIONS);
      return;
    }
    if (key === 'drives') {
      navigation.navigate(STACKS.MY_DRIVES);
      return;
    }
    if (key === 'settings') {
      navigation.navigate(STACKS.SETTINGS);
    }
  };

  return (
    <View style={styles.screen}>
      <Header title="More" role={role} branch={branches} />
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileText}>
            <Text style={styles.profileName}>{name}</Text>
            <Text style={styles.profileMeta}>
              {memberNo} · {role}
            </Text>
          </View>
        </View>

        <View style={styles.scopeCard}>
          <Text style={styles.scopeLabel}>YOUR SCOPE</Text>
          <Text style={styles.scopeTitle}>{branches}</Text>
          <Text style={styles.scopeSubtitle}>{scopeSubtitle}</Text>
        </View>

        <View style={styles.menuCard}>
          {MENU_ITEMS.map((item, index) => (
            <MenuRow
              key={item.key}
              label={item.label}
              Icon={item.Icon}
              last={index === MENU_ITEMS.length - 1}
              badge={
                item.key === 'drives' && liveCount > 0
                  ? `${liveCount} live`
                  : null
              }
              onPress={
                item.key === 'notifications' ||
                item.key === 'drives' ||
                item.key === 'settings'
                  ? () => onMenuPress(item.key)
                  : undefined
              }
            />
          ))}
        </View>

        <TouchableOpacity
          style={styles.signOutBtn}
          activeOpacity={0.7}
          onPress={onSignOut}>
          <LogOut size={18} color={Colors.textPrimary} strokeWidth={2.1} />
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 4,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.primary,
  },
  profileText: { flex: 1, minWidth: 0 },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  profileMeta: { fontSize: 13, color: Colors.textSecondary },
  scopeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  scopeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.7,
    marginBottom: 8,
  },
  scopeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  scopeSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  menuCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
  },
  menuRowLast: {
    borderBottomWidth: 0,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  menuIconWrap: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  liveBadge: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  liveBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  signOutText: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
});

export default MoreScreen;
