import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
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
import { Header } from '../../components/Header';
import { Colors } from '../../theme/colors';
import { STACKS } from '../../enums/ScreenEnums';
import {
  DRIVE_STATUS_OPTIONS,
  apiStatusToUi,
  driveProgress,
  formatDriveDateRange,
  resolveWorkLocationLabels,
  type DriveUiStatus,
} from '../../helpers/membershipDrive.helper';
import {
  ensureDriveAcceptingRegistrations,
  fetchMembershipDrive,
  fetchMembershipDriveStats,
  updateMembershipDriveStatus,
  type MembershipDriveRecord,
  type MembershipDriveStats,
} from '../../services/membershipDrive.services';
import type { MoreStackParamList } from '../../navigation/MoreStack';
import type { RootState } from '../../store';

const DriveDetailsScreen = () => {
  const navigation = useNavigation<any>();
  const route =
    useRoute<RouteProp<MoreStackParamList, typeof STACKS.DRIVE_DETAILS>>();
  const user = useSelector((s: RootState) => s.auth.user);
  const driveId = route.params?.driveId;

  const [drive, setDrive] = useState<MembershipDriveRecord | null>(null);
  const [stats, setStats] = useState<MembershipDriveStats | null>(null);
  const [selectedUi, setSelectedUi] = useState<DriveUiStatus>('Scheduled');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [starting, setStarting] = useState(false);

  const role = user?.role || 'Branch Officer';
  const branch = user?.branches || 'Beaumont & Mater branches';
  const locationRows = user?.workLocationRows || [];

  const load = useCallback(
    async (soft?: boolean) => {
      if (!driveId) return;
      if (!soft) setLoading(true);
      try {
        const [d, s] = await Promise.all([
          fetchMembershipDrive(driveId),
          fetchMembershipDriveStats(driveId).catch(() => null),
        ]);
        setDrive(d);
        setStats(
          s ||
            d.stats || {
              today: 0,
              total: 0,
              rejoins: 0,
              signUpTarget: Number(d.signUpTarget) || 0,
              remainingToTarget: 0,
            },
        );
        setSelectedUi(apiStatusToUi(d.status));
      } catch (e: any) {
        Alert.alert(
          'Drive details',
          e?.message || 'Could not load this drive.',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [driveId],
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const progress = useMemo(() => {
    if (!drive) return { total: 0, target: 0, rejoins: 0, pct: 0 };
    return driveProgress({
      ...drive,
      stats: stats || drive.stats,
    });
  }, [drive, stats]);

  const locationLabel = resolveWorkLocationLabels(
    drive?.workLocations,
    locationRows,
  );

  const createdBy =
    drive?.ownerUserId &&
    user?.id &&
    String(drive.ownerUserId) === String(user.id)
      ? user.name || 'You'
      : user?.name || '—';

  const uiStatus = apiStatusToUi(drive?.status);
  const isLive = drive?.status === 'IN_PROGRESS';
  const isOwner =
    !!drive?.ownerUserId &&
    !!user?.id &&
    String(drive.ownerUserId) === String(user.id);

  const selectedOpt = DRIVE_STATUS_OPTIONS.find(o => o.ui === selectedUi);
  const selectedApi = selectedOpt?.api ?? null;
  const statusDirty =
    !!drive &&
    selectedUi !== apiStatusToUi(drive.status) &&
    selectedUi !== 'Paused';
  const canUpdateStatus = statusDirty || selectedUi === 'Paused';

  const dateRange = formatDriveDateRange(drive?.startDate, drive?.endDate);
  const subtitle = [drive?.driveType, dateRange].filter(Boolean).join(' · ');

  const onUpdateStatus = async () => {
    if (!drive) return;
    if (selectedUi === 'Paused' || selectedApi == null) {
      Alert.alert(
        'Update status',
        'Paused is shown in the design but is not supported by the API yet.',
      );
      setSelectedUi(apiStatusToUi(drive.status));
      return;
    }
    if (!statusDirty) return;
    setSaving(true);
    try {
      const updated = await updateMembershipDriveStatus(drive._id, selectedApi);
      setDrive(updated);
      setSelectedUi(apiStatusToUi(updated.status));
    } catch (e: any) {
      Alert.alert(
        'Update status',
        e?.message || 'Could not update drive status.',
      );
      setSelectedUi(apiStatusToUi(drive.status));
    } finally {
      setSaving(false);
    }
  };

  const onRegisterMember = async () => {
    if (!drive) return;
    setStarting(true);
    try {
      let ready = drive;
      if (drive.status === 'DRAFT') {
        ready = await ensureDriveAcceptingRegistrations(drive);
        setDrive(ready);
        setSelectedUi(apiStatusToUi(ready.status));
      }
      navigation.navigate(STACKS.HOME, {
        screen: STACKS.APPLICATION_FORM,
        params: {
          driveId: ready._id,
          driveName: ready.name,
        },
      });
    } catch (e: any) {
      Alert.alert(
        'Register a member',
        e?.message || 'This drive cannot take new applications.',
      );
    } finally {
      setStarting(false);
    }
  };

  const canRegister =
    drive &&
    (drive.status === 'IN_PROGRESS' ||
      drive.status === 'DRAFT' ||
      drive.status === 'COMPLETED');

  if (loading && !drive) {
    return (
      <View style={styles.screen}>
        <Header
          title="Drive details"
          role={role}
          branch={branch}
          showBack
          onBack={() => navigation.goBack()}
        />
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Header
        title="Drive details"
        role={role}
        branch={branch}
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load(true);
            }}
            tintColor={Colors.primary}
          />
        }>
        {/* Status badges — prototype under title */}
        <View style={styles.badgeRow}>
          <View
            style={[
              styles.badge,
              isLive ? styles.badgeLive : styles.badgeMuted,
            ]}>
            <Text
              style={[
                styles.badgeText,
                isLive ? styles.badgeTextLive : styles.badgeTextMuted,
              ]}>
              {uiStatus}
            </Text>
          </View>
          {isLive && isOwner ? (
            <View style={styles.badgeOutline}>
              <Text style={styles.badgeOutlineText}>Your active drive</Text>
            </View>
          ) : null}
        </View>

        {/* Drive identity */}
        <Text style={styles.driveTitle}>{drive?.name || '—'}</Text>
        {subtitle ? <Text style={styles.driveSubtitle}>{subtitle}</Text> : null}

        {/* Metrics */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{progress.total}</Text>
            <Text style={styles.statLabel}>Signed up</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{progress.rejoins}</Text>
            <Text style={styles.statLabel}>Rejoins</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{progress.pct}%</Text>
            <Text style={styles.statLabel}>of target</Text>
          </View>
        </View>

        {/* Detail rows — label left, value right */}
        <View style={styles.infoBlock}>
          <InfoRow label="Work locations" value={locationLabel} />
          <InfoRow
            label="Target"
            value={`${progress.target || Number(drive?.signUpTarget) || 0} sign-ups`}
          />
          <InfoRow label="Created by" value={createdBy} last />
        </View>

        <Text style={styles.sectionTitle}>Drive status</Text>
        <View style={styles.statusList}>
          {DRIVE_STATUS_OPTIONS.map((opt, index) => {
            const selected = selectedUi === opt.ui;
            return (
              <TouchableOpacity
                key={opt.ui}
                style={[
                  styles.statusRow,
                  index === DRIVE_STATUS_OPTIONS.length - 1 &&
                    styles.statusRowLast,
                ]}
                onPress={() => setSelectedUi(opt.ui)}
                activeOpacity={0.75}>
                <View
                  style={[
                    styles.radioOuter,
                    selected && styles.radioOuterSelected,
                  ]}>
                  {selected ? <View style={styles.radioInner} /> : null}
                </View>
                <View style={styles.statusTextWrap}>
                  <Text style={styles.statusTitle}>{opt.ui}</Text>
                  <Text style={styles.statusDesc}>{opt.description}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.secondaryBtn,
              (!canRegister || starting) && styles.btnDisabled,
            ]}
            onPress={onRegisterMember}
            disabled={!canRegister || starting}
            activeOpacity={0.85}>
            {starting ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Text style={styles.secondaryBtnText}>Register a member</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.primaryBtn,
              (!canUpdateStatus || saving) && styles.primaryBtnMuted,
            ]}
            onPress={onUpdateStatus}
            disabled={!canUpdateStatus || saving}
            activeOpacity={0.85}>
            {saving ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text
                style={[
                  styles.primaryBtnText,
                  (!canUpdateStatus || saving) && styles.primaryBtnTextMuted,
                ]}>
                Update status
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const InfoRow = ({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) => (
  <View style={[styles.infoRow, last && styles.infoRowLast]}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue} numberOfLines={2}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 2,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeLive: {
    backgroundColor: Colors.primaryLight,
  },
  badgeMuted: {
    backgroundColor: Colors.surfaceMuted,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  badgeTextLive: {
    color: Colors.accentInk,
  },
  badgeTextMuted: {
    color: Colors.textSecondary,
  },
  badgeOutline: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
  badgeOutlineText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  driveTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  driveSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 18,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
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
  },
  infoBlock: {
    marginBottom: 22,
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
  },
  infoRowLast: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '400',
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  statusList: {
    marginBottom: 22,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
  },
  statusRowLast: {},
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.borderMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  radioOuterSelected: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  statusTextWrap: { flex: 1, minWidth: 0 },
  statusTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  statusDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnMuted: {
    backgroundColor: Colors.primaryLight,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  primaryBtnTextMuted: {
    color: Colors.primaryMuted,
  },
  btnDisabled: {
    opacity: 0.5,
  },
});

export default DriveDetailsScreen;
