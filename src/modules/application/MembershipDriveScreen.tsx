import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { UserPlus, ChevronDown, Search, Plus } from 'lucide-react-native';
import { Header } from '../../components/Header';
import { Colors, FontFamily, Radii } from '../../theme';
import { STACKS } from '../../enums/ScreenEnums';
import {
  displayRegistrationName,
  driveProgress,
  formatDriveDateRange,
  formatSignupTime,
  isLinkedToday,
  resolveWorkLocationLabels,
} from '../../helpers/membershipDrive.helper';
import {
  ensureDriveAcceptingRegistrations,
  fetchDriveRegistrations,
  fetchMyMembershipDrives,
  type DriveRegistration,
  type MembershipDriveRecord,
} from '../../services/membershipDrive.services';
import type { RootState } from '../../store';
import type { HomeStackParamList } from '../../navigation/HomeStack';

/**
 * Membership drive hub — prototype layout with drive picker, progress,
 * stats, search, and today’s sign-ups.
 */
const MembershipDriveScreen = () => {
  const navigation = useNavigation<any>();
  const route =
    useRoute<RouteProp<HomeStackParamList, typeof STACKS.MEMBERSHIP_DRIVE>>();
  const user = useSelector((s: RootState) => s.auth.user);

  const [drives, setDrives] = useState<MembershipDriveRecord[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [driveOpen, setDriveOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [signups, setSignups] = useState<DriveRegistration[]>([]);
  const [signupsLoading, setSignupsLoading] = useState(false);
  const [starting, setStarting] = useState(false);

  const role = user?.role || 'Branch Officer';
  const branch = user?.branches || 'Beaumont & Mater branches';
  const locationRows = user?.workLocationRows || [];

  const selectedDrive = useMemo(
    () => drives.find(d => d._id === selectedId) || null,
    [drives, selectedId],
  );

  const progress = useMemo(
    () =>
      selectedDrive
        ? driveProgress(selectedDrive)
        : { total: 0, target: 0, rejoins: 0, pct: 0 },
    [selectedDrive],
  );

  const locationLabel = resolveWorkLocationLabels(
    selectedDrive?.workLocations,
    locationRows,
  );

  const driveMetaLeft = selectedDrive
    ? [selectedDrive.driveType, locationLabel !== '—' ? locationLabel : null]
        .filter(Boolean)
        .join(' · ')
    : '';

  const driveMetaRight = selectedDrive
    ? formatDriveDateRange(selectedDrive.startDate, selectedDrive.endDate)
    : '';

  const loadDrives = useCallback(
    async (opts?: { soft?: boolean }) => {
      if (!opts?.soft) setLoading(true);
      try {
        const { drives: rows } = await fetchMyMembershipDrives({
          includeStats: true,
          limit: 50,
        });
        setDrives(rows);

        const preferred =
          route.params?.driveId ||
          (route.params?.driveName
            ? rows.find(d => d.name === route.params?.driveName)?._id
            : undefined);

        setSelectedId(prev => {
          if (preferred && rows.some(d => d._id === preferred)) return preferred;
          if (prev && rows.some(d => d._id === prev)) return prev;
          const active = rows.find(d => d.status === 'IN_PROGRESS');
          return active?._id || rows[0]?._id || '';
        });
      } catch (e: any) {
        Alert.alert(
          'Membership drives',
          e?.message || 'Could not load your membership drives.',
        );
        setDrives([]);
        setSelectedId('');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [route.params?.driveId, route.params?.driveName],
  );

  const loadSignups = useCallback(async (driveId: string) => {
    if (!driveId) {
      setSignups([]);
      return;
    }
    setSignupsLoading(true);
    try {
      const rows = await fetchDriveRegistrations(driveId, 30);
      setSignups(rows.filter(r => isLinkedToday(r.linkedAt)));
    } catch {
      setSignups([]);
    } finally {
      setSignupsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDrives();
    }, [loadDrives]),
  );

  useEffect(() => {
    if (selectedId) loadSignups(selectedId);
    else setSignups([]);
  }, [selectedId, loadSignups]);

  const filteredSignups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return signups;
    return signups.filter(row => {
      const name = displayRegistrationName(row).toLowerCase();
      return name.includes(q);
    });
  }, [signups, search]);

  const openCreateDrive = () => {
    navigation.navigate(STACKS.MORE, {
      screen: STACKS.CREATE_DRIVE,
    });
  };

  const openApplication = async () => {
    if (!selectedDrive) return;
    setStarting(true);
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
      setStarting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <Header
        title="Membership drive"
        role={role}
        branch={branch}
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadDrives({ soft: true });
            }}
            tintColor={Colors.primary}
          />
        }>
        {/* Hint + New drive */}
        <View style={styles.hintRow}>
          <Text style={styles.hint}>
            Drive · every application is tagged with it
          </Text>
          <TouchableOpacity
            style={styles.newDriveBtn}
            onPress={openCreateDrive}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}>
            <Plus size={14} color={Colors.primary} strokeWidth={2.6} />
            <Text style={styles.newDriveLink}>New drive</Text>
          </TouchableOpacity>
        </View>

        {/* Drive picker */}
        <TouchableOpacity
          style={styles.driveSelect}
          activeOpacity={0.8}
          disabled={!drives.length || loading}
          onPress={() => {
            if (drives.length) setDriveOpen(v => !v);
          }}>
          <Text
            style={[
              styles.driveSelectText,
              !selectedDrive && styles.driveSelectPlaceholder,
            ]}
            numberOfLines={1}>
            {loading
              ? 'Loading drives…'
              : selectedDrive?.name || 'Select a membership drive'}
          </Text>
          {loading ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <ChevronDown size={18} color={Colors.textMuted} strokeWidth={2} />
          )}
        </TouchableOpacity>

        {driveOpen && drives.length > 0 ? (
          <View style={styles.driveMenu}>
            {drives.map((drive, index) => (
              <TouchableOpacity
                key={drive._id}
                style={[
                  styles.driveOption,
                  index === drives.length - 1 && styles.driveOptionLast,
                ]}
                onPress={() => {
                  setSelectedId(drive._id);
                  setDriveOpen(false);
                }}
                activeOpacity={0.7}>
                <Text
                  style={[
                    styles.driveOptionText,
                    drive._id === selectedId && styles.driveOptionActive,
                  ]}>
                  {drive.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {/* Meta + progress — prototype under picker */}
        {selectedDrive ? (
          <View style={styles.driveMetaBlock}>
            <View style={styles.driveMetaRow}>
              <Text style={styles.driveMetaLeft} numberOfLines={2}>
                {driveMetaLeft}
              </Text>
              <Text style={styles.driveMetaRight}>{driveMetaRight}</Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progress.pct}%` },
                ]}
              />
            </View>
            <Text style={styles.progressLabel}>
              {progress.total} of {progress.target || 0} target
            </Text>
          </View>
        ) : null}

        {!loading && drives.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyLocations}>
              You have no membership drives yet. Create one to tag applications
              and track sign-ups.
            </Text>
            <TouchableOpacity
              style={styles.emptyCreateBtn}
              onPress={openCreateDrive}
              activeOpacity={0.85}>
              <Plus size={16} color={Colors.primary} strokeWidth={2.4} />
              <Text style={styles.emptyCreateText}>Create membership drive</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {selectedDrive ? selectedDrive.stats?.today ?? 0 : '—'}
            </Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {selectedDrive ? progress.total : '—'}
            </Text>
            <Text style={styles.statLabel}>This drive</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {selectedDrive ? progress.rejoins : '—'}
            </Text>
            <Text style={styles.statLabel}>Rejoins</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>
          CHECK FOR AN EXISTING PROFILE FIRST
        </Text>
        <View style={styles.searchBar}>
          <Search size={18} color={Colors.textMuted} strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Name, email or mobile"
            placeholderTextColor={Colors.textPlaceholder}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
        </View>

        <TouchableOpacity
          style={[
            styles.primaryBtn,
            (!selectedDrive || starting) && styles.primaryBtnDisabled,
          ]}
          activeOpacity={0.85}
          onPress={openApplication}
          disabled={!selectedDrive || starting}>
          {starting ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <UserPlus size={18} color={Colors.primary} strokeWidth={2.2} />
          )}
          <Text style={styles.primaryBtnText}>New member application</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>
          SIGNED UP TODAY
        </Text>
        {signupsLoading ? (
          <View style={styles.signupEmpty}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        ) : filteredSignups.length === 0 ? (
          <View style={styles.signupEmpty}>
            <Text style={styles.signupEmptyText}>
              {selectedDrive
                ? 'No sign-ups linked to this drive today.'
                : "Select a drive to see today's sign-ups."}
            </Text>
          </View>
        ) : (
          <View style={styles.listBlock}>
            {filteredSignups.map((item, index) => (
              <View
                key={item.applicationId}
                style={[
                  styles.signupRow,
                  index === filteredSignups.length - 1 && styles.signupRowLast,
                ]}>
                <Text style={styles.signupName}>
                  {displayRegistrationName(item)}
                </Text>
                <Text style={styles.signupMeta}>
                  {item.isRejoin ? 'Rejoin' : 'New'}
                  {formatSignupTime(item.linkedAt)
                    ? ` · ${formatSignupTime(item.linkedAt)}`
                    : ''}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 4,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  hint: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  newDriveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  newDriveLink: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    color: Colors.primary,
  },
  driveSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
  },
  driveSelectText: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: 15,
    color: Colors.textPrimary,
    marginRight: 8,
  },
  driveSelectPlaceholder: {
    fontFamily: FontFamily.regular,
    color: Colors.textMuted,
  },
  driveMenu: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
    overflow: 'hidden',
  },
  driveOption: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
  },
  driveOptionLast: {
    borderBottomWidth: 0,
  },
  driveOptionText: {
    fontFamily: FontFamily.medium,
    fontSize: 15,
    color: Colors.textSecondary,
  },
  driveOptionActive: {
    fontFamily: FontFamily.semiBold,
    color: Colors.primary,
  },
  driveMetaBlock: {
    marginBottom: 18,
  },
  driveMetaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  driveMetaLeft: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  driveMetaRight: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: Colors.textSecondary,
    flexShrink: 0,
  },
  progressTrack: {
    height: 8,
    borderRadius: Radii.pill,
    backgroundColor: Colors.primaryLight,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: Radii.pill,
    backgroundColor: Colors.primary,
  },
  progressLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  emptyBox: {
    marginBottom: 14,
  },
  emptyLocations: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  emptyCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: Radii.lg,
    paddingVertical: 12,
    marginBottom: 8,
  },
  emptyCreateText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    color: Colors.primary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 22,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  statValue: {
    fontFamily: FontFamily.medium,
    fontSize: 26,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: Colors.textMuted,
  },
  sectionLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  sectionLabelSpaced: {
    marginTop: 22,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: Radii.lg,
    paddingVertical: 14,
  },
  primaryBtnDisabled: {
    opacity: 0.5,
  },
  primaryBtnText: {
    fontFamily: FontFamily.medium,
    fontSize: 15,
    color: Colors.primary,
  },
  listBlock: {
    marginTop: 0,
  },
  signupEmpty: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  signupEmptyText: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  signupRowLast: {
    borderBottomWidth: 0,
  },
  signupName: {
    fontFamily: FontFamily.medium,
    fontSize: 15,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 12,
  },
  signupMeta: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: Colors.textMuted,
  },
});

export default MembershipDriveScreen;
