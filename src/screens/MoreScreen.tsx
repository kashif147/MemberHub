import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Colors } from '../theme/colors';
import { Header } from '../components/Header';
import { signOut } from '../services/auth.services';
import type { AppDispatch, RootState } from '../store';

const MenuRow = ({ icon, label }: { icon: string; label: string }) => (
  <TouchableOpacity style={styles.menuRow} activeOpacity={0.7}>
    <View style={styles.menuLeft}>
      <Text style={styles.menuIcon}>{icon}</Text>
      <Text style={styles.menuLabel}>{label}</Text>
    </View>
    <Text style={styles.menuChevron}>›</Text>
  </TouchableOpacity>
);

const MoreScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((s: RootState) => s.auth.user);

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
          <View>
            <Text style={styles.profileName}>{name}</Text>
            <Text style={styles.profileMeta}>
              {memberNo} · {role}
            </Text>
          </View>
        </View>

        <View style={styles.scopeCard}>
          <Text style={styles.scopeLabel}>YOUR SCOPE</Text>
          <Text style={styles.scopeTitle}>{branches}</Text>
          <Text style={styles.scopeSubtitle}>
            8 members · set by your rep role in the CRM
          </Text>
        </View>

        <View style={styles.menuCard}>
          <MenuRow icon="👥" label="My drives" />
          <View style={styles.divider} />
          <MenuRow icon="🔔" label="Notifications" />
          <View style={styles.divider} />
          <MenuRow icon="🔄" label="Open member app" />
          <View style={styles.divider} />
          <MenuRow icon="⚙️" label="Settings" />
        </View>

        <TouchableOpacity
          style={styles.signOutBtn}
          activeOpacity={0.7}
          onPress={onSignOut}>
          <Text style={styles.signOutText}>⎋  Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  profileMeta: { fontSize: 13, color: Colors.textSecondary },
  scopeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  scopeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  scopeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  scopeSubtitle: { fontSize: 12, color: Colors.textSecondary },
  menuCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  menuIcon: {
    fontSize: 18,
    width: 24,
    textAlign: 'center',
    color: Colors.primary,
  },
  menuLabel: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  menuChevron: {
    fontSize: 22,
    color: Colors.textMuted,
    marginTop: -2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginLeft: 54,
  },
  signOutBtn: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  signOutText: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
});

export default MoreScreen;
