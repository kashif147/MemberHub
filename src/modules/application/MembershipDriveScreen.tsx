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
import { Colors } from '../../theme/colors';
import { STACKS } from '../../enums/ScreenEnums';
import {
  displayRegistrationName,
  formatDriveStatusLabel,
  formatSignupTime,
  isLinkedToday,
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
 * Membership drive hub — list / select officer drives from profile-service,
 * show stats + today's sign-ups, open application tagged to the drive.
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

  const selectedDrive = useMemo(
    () => drives.find(d => d._id === selectedId) || null,
    [drives, selectedId],
  );

  const stats = selectedDrive?.stats;

  const loadDrives = useCallback(async (opts?: { soft?: boolean }) => {
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
  }, [route.params?.driveId, route.params?.driveName]);

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
    navigation.navigate(STACKS.CREATE_DRIVE);
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
        <View style={styles.hintRow}>
          <Text style={styles.hint}>
            Drive · every application is tagged with it
          </Text>
          <TouchableOpacity
            onPress={openCreateDrive}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}>
            <Text style={styles.newDriveLink}>New drive</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.driveSelect}
          activeOpacity={0.8}
          disabled={!drives.length || loading}
          onPress={() => {
            if (drives.length) setDriveOpen(v => !v);
          }}>
          <View style={styles.driveSelectMain}>
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
            {selectedDrive ? (
              <Text style={styles.driveStatus}>
                {formatDriveStatusLabel(selectedDrive.status)}
              </Text>
            ) : null}
          </View>
          {loading ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <ChevronDown size={18} color={Colors.textMuted} strokeWidth={2} />
          )}
        </TouchableOpacity>

        {driveOpen && drives.length > 0 ? (
          <View style={styles.driveMenu}>
            {drives.map(drive => (
              <TouchableOpacity
                key={drive._id}
                style={styles.driveOption}
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
                <Text style={styles.driveOptionMeta}>
                  {formatDriveStatusLabel(drive.status)}
                  {drive.stats != null ? ` · ${drive.stats.total} signed` : ''}
                </Text>
              </TouchableOpacity>
            ))}
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

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats?.today ?? '—'}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats?.total ?? '—'}</Text>
            <Text style={styles.statLabel}>This drive</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats?.rejoins ?? '—'}</Text>
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
        <View style={styles.listCard}>
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
            filteredSignups.map((item, index) => (
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
            ))
          )}
        </View>
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
    marginBottom: 10,
    gap: 12,
  },
  hint: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  newDriveLink: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  driveSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
  },
  driveSelectMain: {
    flex: 1,
    marginRight: 8,
  },
  driveSelectText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  driveSelectPlaceholder: {
    fontWeight: '500',
    color: Colors.textMuted,
  },
  driveStatus: {
    marginTop: 2,
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  driveMenu: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
    overflow: 'hidden',
  },
  driveOption: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
  },
  driveOptionText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  driveOptionActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  driveOptionMeta: {
    marginTop: 2,
    fontSize: 12,
    color: Colors.textMuted,
  },
  emptyBox: {
    marginBottom: 14,
  },
  emptyLocations: {
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
    borderRadius: 14,
    paddingVertical: 12,
  },
  emptyCreateText: {
    fontSize: 14,
    fontWeight: '600',
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
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '400',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.8,
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
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
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
    borderRadius: 14,
    paddingVertical: 14,
  },
  primaryBtnDisabled: {
    opacity: 0.5,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
  listCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
  },
  signupEmpty: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: 'center',
  },
  signupEmptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
  },
  signupRowLast: {
    borderBottomWidth: 0,
  },
  signupName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 12,
  },
  signupMeta: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});

export default MembershipDriveScreen;
