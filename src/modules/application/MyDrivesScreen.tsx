import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { Plus } from 'lucide-react-native';
import { Header } from '../../components/Header';
import { Colors } from '../../theme/colors';
import { STACKS } from '../../enums/ScreenEnums';
import {
  apiStatusToUi,
  driveProgress,
  formatDriveDateRange,
  resolveWorkLocationLabels,
} from '../../helpers/membershipDrive.helper';
import {
  fetchMyDrivesGrouped,
  type MembershipDriveRecord,
} from '../../services/membershipDrive.services';
import type { RootState } from '../../store';

type TabKey = 'open' | 'previous';

const DriveCard = ({
  drive,
  locationLabel,
  onPress,
}: {
  drive: MembershipDriveRecord;
  locationLabel: string;
  onPress: () => void;
}) => {
  const uiStatus = apiStatusToUi(drive.status);
  const { total, target, rejoins, pct } = driveProgress(drive);
  const isLive = drive.status === 'IN_PROGRESS';
  const dateRange = formatDriveDateRange(drive.startDate, drive.endDate);
  const meta = [dateRange, locationLabel].filter(Boolean).join(' · ');

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}>
      <View style={styles.cardTop}>
        <View style={styles.cardTopText}>
          <Text style={styles.driveType} numberOfLines={1}>
            {String(drive.driveType || '').toUpperCase()}
          </Text>
          <Text style={styles.driveName} numberOfLines={2}>
            {drive.name}
          </Text>
          {meta ? (
            <Text style={styles.driveMeta} numberOfLines={2}>
              {meta}
            </Text>
          ) : null}
        </View>
        <View
          style={[
            styles.statusBadge,
            isLive ? styles.statusBadgeLive : styles.statusBadgeOutline,
          ]}>
          <Text
            style={[
              styles.statusBadgeText,
              isLive
                ? styles.statusBadgeTextLive
                : styles.statusBadgeTextMuted,
            ]}>
            {uiStatus}
          </Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${pct}%` },
            !isLive && pct === 0 && styles.progressFillEmpty,
          ]}
        />
      </View>
      <View style={styles.progressRow}>
        <Text style={styles.progressLabel}>
          {total} of {target || 0} target
        </Text>
        <Text style={styles.progressLabel}>
          {rejoins} rejoin{rejoins === 1 ? '' : 's'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const MyDrivesScreen = () => {
  const navigation = useNavigation<any>();
  const user = useSelector((s: RootState) => s.auth.user);
  const [tab, setTab] = useState<TabKey>('open');
  const [open, setOpen] = useState<MembershipDriveRecord[]>([]);
  const [previous, setPrevious] = useState<MembershipDriveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const role = user?.role || 'Branch Officer';
  const branch = user?.branches || 'Beaumont & Mater branches';
  const locationRows = user?.workLocationRows || [];

  const load = useCallback(async (soft?: boolean) => {
    if (!soft) setLoading(true);
    try {
      const result = await fetchMyDrivesGrouped();
      setOpen(result.open);
      setPrevious(result.previous);
    } catch (e: any) {
      Alert.alert(
        'My drives',
        e?.message || 'Could not load your membership drives.',
      );
      setOpen([]);
      setPrevious([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const list = tab === 'open' ? open : previous;

  const tabs = useMemo(
    () => [
      { key: 'open' as const, label: `Open · ${open.length}` },
      { key: 'previous' as const, label: `Previous · ${previous.length}` },
    ],
    [open.length, previous.length],
  );

  return (
    <View style={styles.screen}>
      <Header
        title="My drives"
        role={role}
        branch={branch}
        showBack
        onBack={() => navigation.goBack()}
      />

      <View style={styles.tabs}>
        {tabs.map(t => {
          const active = tab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setTab(t.key)}
              activeOpacity={0.8}>
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

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
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : list.length === 0 ? (
          <Text style={styles.empty}>
            {tab === 'open'
              ? 'No open drives. Create one to start tagging applications.'
              : 'No previous drives yet.'}
          </Text>
        ) : (
          list.map(drive => (
            <DriveCard
              key={drive._id}
              drive={drive}
              locationLabel={resolveWorkLocationLabels(
                drive.workLocations,
                locationRows,
              )}
              onPress={() =>
                navigation.navigate(STACKS.DRIVE_DETAILS, {
                  driveId: drive._id,
                })
              }
            />
          ))
        )}

        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => navigation.navigate(STACKS.CREATE_DRIVE)}
          activeOpacity={0.85}>
          <Plus size={18} color={Colors.primary} strokeWidth={2.4} />
          <Text style={styles.newBtnText}>New membership drive</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 12,
    backgroundColor: Colors.surfaceMuted,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.primary,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  center: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  empty: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: 16,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 14,
  },
  cardTopText: { flex: 1, minWidth: 0 },
  driveType: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  driveName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  driveMeta: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusBadgeLive: {
    backgroundColor: Colors.primaryLight,
  },
  statusBadgeOutline: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadgeTextLive: {
    color: Colors.accentInk,
  },
  statusBadgeTextMuted: {
    color: Colors.primary,
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: Colors.surfaceMuted,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: Colors.primary,
  },
  progressFillEmpty: {
    backgroundColor: Colors.borderMuted,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
  },
  newBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
});

export default MyDrivesScreen;
