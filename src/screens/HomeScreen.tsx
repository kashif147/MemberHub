import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { ChevronDown, Plus, Search, UserPlus } from 'lucide-react-native';
import { Colors, FontFamily, Radii } from '../theme';
import { Header } from '../components/Header';
import { CaseListCard, CaseListRow } from '../components/CaseListRow';
import { loadCasesList } from '../services/issues.services';
import {
  ensureDriveAcceptingRegistrations,
  fetchMyMembershipDrives,
  type MembershipDriveRecord,
} from '../services/membershipDrive.services';
import { driveProgress, isOpenDrive } from '../helpers/membershipDrive.helper';
import { STACKS } from '../enums/ScreenEnums';
import type { CaseItem } from '../data/mockCases';
import type { RootState } from '../store';

const MEMBER_COUNT = 8;
const RECENT_CASES_LIMIT = 4;
const SETTINGS_KEY = '@memberhub/settings_prefs';

const StatCard = ({
  value,
  label,
  highlighted,
  onPress,
}: {
  value: number;
  label: string;
  highlighted?: boolean;
  onPress?: () => void;
}) => (
  <TouchableOpacity
    style={[styles.statCard, highlighted && styles.statCardHighlighted]}
    activeOpacity={0.85}
    onPress={onPress}
    disabled={!onPress}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </TouchableOpacity>
);

const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const user = useSelector((s: RootState) => s.auth.user);

  const [recentCases, setRecentCases] = useState<CaseItem[]>([]);
  const [casesLoading, setCasesLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [casesError, setCasesError] = useState<string | null>(null);

  const [drives, setDrives] = useState<MembershipDriveRecord[]>([]);
  const [selectedDriveId, setSelectedDriveId] = useState('');
  const [drivesLoading, setDrivesLoading] = useState(true);
  const [driveMenuOpen, setDriveMenuOpen] = useState(false);
  const [registering, setRegistering] = useState(false);

  const role = user?.role || 'Branch Officer';
  const branch = user?.branches || 'Beaumont & Mater branches';
  const memberCount = useMemo(() => MEMBER_COUNT, []);

  const userId = user?.id && user.id !== 'bo-demo' ? user.id : null;

  const selectedDrive = useMemo(
    () => drives.find(d => d._id === selectedDriveId) || null,
    [drives, selectedDriveId],
  );

  const progress = useMemo(
    () =>
      selectedDrive
        ? driveProgress(selectedDrive)
        : { total: 0, target: 0, rejoins: 0, pct: 0 },
    [selectedDrive],
  );

  const isLive = selectedDrive?.status === 'IN_PROGRESS';
  const todayCount = Number(selectedDrive?.stats?.today ?? 0) || 0;

  const loadRecentCases = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setCasesLoading(true);
      setCasesError(null);
      try {
        const rows = await loadCasesList(userId);
        setRecentCases(rows.slice(0, RECENT_CASES_LIMIT));
      } catch (e: any) {
        setCasesError(e?.message || 'Failed to load cases');
        setRecentCases([]);
      } finally {
        setCasesLoading(false);
        setRefreshing(false);
      }
    },
    [userId],
  );

  const loadDrives = useCallback(async (opts?: { soft?: boolean }) => {
    if (!opts?.soft) setDrivesLoading(true);
    try {
      const [{ drives: rows }, prefsRaw] = await Promise.all([
        fetchMyMembershipDrives({ includeStats: true, limit: 50 }),
        AsyncStorage.getItem(SETTINGS_KEY).catch(() => null),
      ]);

      let defaultDriveId: string | null = null;
      if (prefsRaw) {
        try {
          const prefs = JSON.parse(prefsRaw);
          defaultDriveId = prefs?.defaultDriveId
            ? String(prefs.defaultDriveId)
            : null;
        } catch {
          defaultDriveId = null;
        }
      }

      // Prefer open drives for home registration; fall back to full list.
      const open = rows.filter(d => isOpenDrive(d.status));
      const list = open.length ? open : rows;
      setDrives(list);

      setSelectedDriveId(prev => {
        if (defaultDriveId && list.some(d => d._id === defaultDriveId)) {
          return defaultDriveId;
        }
        if (prev && list.some(d => d._id === prev)) return prev;
        const live = list.find(d => d.status === 'IN_PROGRESS');
        return live?._id || list[0]?._id || '';
      });
    } catch {
      setDrives([]);
      setSelectedDriveId('');
    } finally {
      setDrivesLoading(false);
    }
  }, []);

  const refreshHome = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      await Promise.all([
        loadRecentCases(isRefresh),
        loadDrives({ soft: isRefresh || !drivesLoading }),
      ]);
      setRefreshing(false);
    },
    [loadRecentCases, loadDrives, drivesLoading],
  );

  useFocusEffect(
    useCallback(() => {
      loadRecentCases(false);
      loadDrives();
    }, [loadRecentCases, loadDrives]),
  );

  const openCreateDrive = () => {
    setDriveMenuOpen(false);
    navigation.navigate(STACKS.CREATE_DRIVE);
  };

  const openRegisterMember = async () => {
    if (!selectedDrive) {
      Alert.alert(
        'Membership drive',
        'Select a membership drive first, or create one.',
      );
      return;
    }
    setDriveMenuOpen(false);
    setRegistering(true);
    try {
      const drive = await ensureDriveAcceptingRegistrations(selectedDrive);
      if (drive.status !== selectedDrive.status) {
        setDrives(prev =>
          prev.map(d => (d._id === drive._id ? { ...d, ...drive } : d)),
        );
      }
      navigation.navigate(STACKS.APPLICATION_FORM, {
        driveId: drive._id,
        driveName: drive.name,
      });
    } catch (e: any) {
      Alert.alert(
        'Membership drive',
        e?.message || 'This drive cannot take new applications.',
      );
    } finally {
      setRegistering(false);
    }
  };

  const openMembers = () => {
    navigation.getParent()?.navigate(STACKS.MEMBERS);
  };

  const openCases = () => {
    navigation.getParent()?.navigate(STACKS.CASES, {
      screen: STACKS.CASES_LIST,
    });
  };

  return (
    <View style={styles.screen}>
      <Header title="Home" role={role} branch={branch} />
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => refreshHome(true)}
            tintColor={Colors.primary}
          />
        }>
        <View style={styles.searchBar}>
          <Search size={18} color={Colors.textPlaceholder} strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${memberCount} members`}
            placeholderTextColor={Colors.textPlaceholder}
            returnKeyType="search"
            onFocus={openMembers}
          />
        </View>

        <View style={styles.statsRow}>
          <StatCard value={memberCount} label="Members" onPress={openMembers} />
          <StatCard
            value={2}
            label="In arrears"
            highlighted
            onPress={openMembers}
          />
          <StatCard value={1} label="Lapsed" onPress={openMembers} />
        </View>

        <View style={styles.driveCard}>
          <View style={styles.driveHeader}>
            <Text style={styles.driveLabel}>
              {isLive ? 'Drive in progress' : 'Membership drive'}
            </Text>
            {isLive ? (
              <View style={styles.liveBadge}>
                <Text style={styles.liveBadgeText}>Live</Text>
              </View>
            ) : selectedDrive ? (
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>
                  {selectedDrive.status === 'DRAFT' ? 'Scheduled' : 'Drive'}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Drive dropdown — select which drive the card / register uses */}
          <TouchableOpacity
            style={styles.driveSelect}
            activeOpacity={0.8}
            disabled={drivesLoading || drives.length === 0}
            onPress={() => {
              if (drives.length) setDriveMenuOpen(v => !v);
            }}>
            <Text
              style={[
                styles.driveSelectText,
                !selectedDrive && styles.driveSelectPlaceholder,
              ]}
              numberOfLines={1}>
              {drivesLoading
                ? 'Loading drives…'
                : selectedDrive?.name || 'Select a membership drive'}
            </Text>
            {drivesLoading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <ChevronDown
                size={18}
                color={Colors.textMuted}
                strokeWidth={2}
              />
            )}
          </TouchableOpacity>

          {driveMenuOpen && drives.length > 0 ? (
            <View style={styles.driveMenu}>
              {drives.map((drive, index) => (
                <TouchableOpacity
                  key={drive._id}
                  style={[
                    styles.driveOption,
                    index === drives.length - 1 && styles.driveOptionLast,
                  ]}
                  onPress={() => {
                    setSelectedDriveId(drive._id);
                    setDriveMenuOpen(false);
                  }}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      styles.driveOptionText,
                      drive._id === selectedDriveId &&
                        styles.driveOptionActive,
                    ]}
                    numberOfLines={1}>
                    {drive.name}
                  </Text>
                  {drive.status === 'IN_PROGRESS' ? (
                    <Text style={styles.driveOptionLive}>Live</Text>
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          {selectedDrive ? (
            <>
              <Text style={styles.driveTitle} numberOfLines={2}>
                {selectedDrive.name}
              </Text>
              <View style={styles.driveStats}>
                <Text style={styles.driveStat}>
                  <Text style={styles.driveStatBold}>{todayCount}</Text>
                  <Text style={styles.driveStatMuted}> today</Text>
                </Text>
                <Text style={styles.driveStat}>
                  <Text style={styles.driveStatBold}>{progress.total}</Text>
                  <Text style={styles.driveStatMuted}> this drive</Text>
                </Text>
                <Text style={styles.driveStat}>
                  <Text style={styles.driveStatBold}>{progress.rejoins}</Text>
                  <Text style={styles.driveStatMuted}> rejoins</Text>
                </Text>
              </View>
              <TouchableOpacity
                style={styles.registerBtn}
                activeOpacity={0.8}
                disabled={registering}
                onPress={openRegisterMember}>
                {registering ? (
                  <ActivityIndicator color={Colors.primary} size="small" />
                ) : (
                  <UserPlus
                    size={18}
                    color={Colors.primary}
                    strokeWidth={2.2}
                  />
                )}
                <Text style={styles.registerBtnText}>
                  {registering ? 'Opening…' : 'Register a member'}
                </Text>
              </TouchableOpacity>
            </>
          ) : !drivesLoading ? (
            <View style={styles.driveEmpty}>
              <Text style={styles.driveEmptyText}>
                No open membership drives yet. Create one to register members.
              </Text>
              <TouchableOpacity
                style={styles.createDriveBtn}
                onPress={openCreateDrive}
                activeOpacity={0.85}>
                <Plus size={16} color={Colors.primary} strokeWidth={2.4} />
                <Text style={styles.createDriveText}>Create drive</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent cases</Text>
          <TouchableOpacity onPress={openCases} hitSlop={8}>
            <Text style={styles.viewAll}>View all</Text>
          </TouchableOpacity>
        </View>

        {casesLoading ? (
          <View style={styles.casesState}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.casesStateText}>Loading cases…</Text>
          </View>
        ) : recentCases.length === 0 ? (
          <View style={styles.casesState}>
            <Text style={styles.casesStateText}>
              {casesError || 'No cases yet.'}
            </Text>
            {casesError ? (
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => loadRecentCases(false)}
                activeOpacity={0.8}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          <CaseListCard>
            {recentCases.map((item, index, arr) => (
              <CaseListRow
                key={item.id}
                title={item.title}
                caseNo={item.caseNo}
                member={item.member}
                status={item.status}
                last={index === arr.length - 1}
                onPress={() =>
                  navigation.getParent()?.navigate(STACKS.CASES, {
                    screen: STACKS.CASE_DETAIL,
                    params: {
                      issueId: item.id,
                      title: item.caseNo,
                    },
                  })
                }
              />
            ))}
          </CaseListCard>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    height: 44,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statCardHighlighted: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  statValue: {
    fontFamily: FontFamily.medium,
    fontSize: 26,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: Colors.textMuted,
  },
  driveCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    padding: 16,
    gap: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  driveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  driveLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: Colors.primary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  liveBadge: {
    backgroundColor: Colors.liveBadge,
    borderRadius: Radii.sm + 2,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  liveBadgeText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: Colors.liveBadgeText,
  },
  statusBadge: {
    backgroundColor: Colors.surfaceMuted,
    borderRadius: Radii.sm + 2,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusBadgeText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  driveSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: Colors.background,
  },
  driveSelectText: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  driveSelectPlaceholder: {
    color: Colors.textPlaceholder,
    fontFamily: FontFamily.regular,
  },
  driveMenu: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
    marginTop: -4,
  },
  driveOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
  },
  driveOptionLast: {
    borderBottomWidth: 0,
  },
  driveOptionText: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  driveOptionActive: {
    fontFamily: FontFamily.semiBold,
    color: Colors.primary,
  },
  driveOptionLive: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: Colors.primary,
  },
  driveTitle: {
    fontFamily: FontFamily.medium,
    fontSize: 17,
    color: Colors.textPrimary,
  },
  driveStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  driveStat: {
    fontSize: 13,
  },
  driveStatBold: {
    fontFamily: FontFamily.medium,
    color: Colors.textPrimary,
    fontSize: 17,
  },
  driveStatMuted: {
    fontFamily: FontFamily.regular,
    color: Colors.textMuted,
    fontSize: 13,
  },
  registerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: Radii.md,
    minHeight: 46,
    backgroundColor: Colors.surface,
  },
  registerBtnText: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: Colors.primary,
  },
  driveEmpty: {
    gap: 12,
  },
  driveEmptyText: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textSecondary,
  },
  createDriveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: Radii.md,
    minHeight: 42,
  },
  createDriveText: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: Colors.primary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: Colors.textPlaceholder,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  viewAll: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: Colors.primary,
  },
  casesState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    gap: 10,
  },
  casesStateText: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  retryText: {
    fontFamily: FontFamily.medium,
    color: Colors.primary,
    fontSize: 13,
  },
});

export default HomeScreen;
