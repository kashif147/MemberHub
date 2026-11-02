import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { Colors, FontFamily } from '../theme';
import { Header } from '../components/Header';
import { CaseCard } from '../components/CaseCard';
import {
  loadMyCasesList,
  type MyIssuesScope,
} from '../services/issues.services';
import { STACKS } from '../enums/ScreenEnums';
import type { CasesStackParamList } from '../navigation/CasesStack';
import type { CaseItem } from '../data/mockCases';
import type { RootState } from '../store';

const SCOPE_TABS: Array<{ key: MyIssuesScope; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'created', label: 'Created' },
  { key: 'assigned', label: 'Assigned' },
];

const STATUS_TABS = ['All', 'Open', 'In progress', 'Closed'] as const;

const CasesScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<CasesStackParamList>>();
  const user = useSelector((s: RootState) => s.auth.user);
  const [scope, setScope] = useState<MyIssuesScope>('all');
  const [statusTab, setStatusTab] =
    useState<(typeof STATUS_TABS)[number]>('All');
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [openCounts, setOpenCounts] = useState({ created: 0, assigned: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedOnce = useRef(false);

  const role = user?.role || 'Branch Officer';
  const branch = user?.branches || 'Beaumont & Mater branches';
  const userId = user?.id && user.id !== 'bo-demo' ? user.id : null;

  const load = useCallback(
    async (isRefresh = false, nextScope: MyIssuesScope = scope) => {
      // Keep filters + list mounted on scope change (avoids jump); spinner only on first load.
      if (isRefresh) setRefreshing(true);
      else if (!hasLoadedOnce.current) setLoading(true);
      setError(null);
      try {
        const { cases: rows, meta } = await loadMyCasesList({
          scope: nextScope,
          limit: 100,
          currentUserId: userId,
        });
        setCases(rows);
        setOpenCounts({
          created: meta.openCounts?.created || 0,
          assigned: meta.openCounts?.assigned || 0,
        });
        hasLoadedOnce.current = true;
      } catch (e: any) {
        setError(e?.message || 'Failed to load cases');
        setCases([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [scope, userId],
  );

  useFocusEffect(
    useCallback(() => {
      load(false, scope);
    }, [load, scope]),
  );

  const filtered = useMemo(
    () =>
      cases.filter(c => statusTab === 'All' || c.status === statusTab),
    [cases, statusTab],
  );

  /** Always reserve badge space for Created/Assigned so tabs don't reflow. */
  const scopeBadge = (key: MyIssuesScope): string | null => {
    if (key === 'created') return String(openCounts.created || 0);
    if (key === 'assigned') return String(openCounts.assigned || 0);
    return null;
  };

  const emptyMessage = () => {
    if (error) return error;
    const scopeLabel =
      scope === 'created'
        ? 'created'
        : scope === 'assigned'
          ? 'assigned'
          : '';
    if (statusTab === 'All') {
      return scopeLabel ? `No ${scopeLabel} cases.` : 'No cases yet.';
    }
    return scopeLabel
      ? `No ${statusTab.toLowerCase()} ${scopeLabel} cases.`
      : `No ${statusTab.toLowerCase()} cases.`;
  };

  return (
    <View style={styles.screen}>
      <Header title="Cases" role={role} branch={branch} />
      <View style={styles.content}>
        <View style={styles.tabRow}>
          {SCOPE_TABS.map(tab => {
            const active = scope === tab.key;
            const badge = scopeBadge(tab.key);
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, active && styles.tabActive]}
                onPress={() => setScope(tab.key)}
                activeOpacity={0.7}>
                <View style={styles.tabInner}>
                  <Text
                    style={[styles.tabText, active && styles.tabTextActive]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.85}>
                    {tab.label}
                  </Text>
                  {badge != null ? (
                    <View
                      style={[
                        styles.countBadge,
                        active && styles.countBadgeActive,
                        Number(badge) === 0 && styles.countBadgeEmpty,
                      ]}>
                      <Text
                        style={[
                          styles.countBadgeText,
                          active && styles.countBadgeTextActive,
                          Number(badge) === 0 && styles.countBadgeTextEmpty,
                        ]}
                        numberOfLines={1}>
                        {badge}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.statusRow}>
          {STATUS_TABS.map(tab => {
            const active = statusTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.statusChip, active && styles.statusChipActive]}
                onPress={() => setStatusTab(tab)}
                activeOpacity={0.7}>
                <Text
                  style={[
                    styles.statusChipText,
                    active && styles.statusChipTextActive,
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.centerText}>Loading cases…</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.listContent,
              filtered.length === 0 && styles.listEmpty,
            ]}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => load(true, scope)}
                tintColor={Colors.primary}
              />
            }>
            {filtered.length === 0 ? (
              <View style={styles.center}>
                <Text style={styles.centerText}>{emptyMessage()}</Text>
                {error ? (
                  <TouchableOpacity
                    style={styles.retryBtn}
                    onPress={() => load(false, scope)}
                    activeOpacity={0.8}>
                    <Text style={styles.retryText}>Retry</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : (
              filtered.map(item => (
                <CaseCard
                  key={item.id}
                  item={item}
                  onPress={() =>
                    navigation.navigate(STACKS.CASE_DETAIL, {
                      issueId: item.id,
                      title: item.caseNo,
                    })
                  }
                />
              ))
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 4,
    marginBottom: 10,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    // Always reserve border so active state doesn't resize / shift neighbours.
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  tabActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
  tabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    maxWidth: '100%',
  },
  tabText: {
    flexShrink: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: FontFamily.medium,
  },
  tabTextActive: {
    color: Colors.primary,
    fontFamily: FontFamily.medium,
  },
  countBadge: {
    minWidth: 20,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  countBadgeActive: {
    backgroundColor: Colors.primary,
  },
  countBadgeEmpty: {
    opacity: 0.35,
  },
  countBadgeText: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontFamily: FontFamily.semiBold,
  },
  countBadgeTextActive: {
    color: Colors.surface,
  },
  countBadgeTextEmpty: {
    color: Colors.textMuted,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 6,
    marginBottom: 12,
  },
  statusChip: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
  statusChipText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontFamily: FontFamily.medium,
    textAlign: 'center',
  },
  statusChipTextActive: {
    color: Colors.primary,
    fontFamily: FontFamily.medium,
  },
  listContent: {
    gap: 6,
    paddingBottom: 40,
  },
  listEmpty: {
    flexGrow: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 10,
    minHeight: 180,
  },
  centerText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontFamily: FontFamily.regular,
  },
  retryBtn: {
    marginTop: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  retryText: {
    color: Colors.primary,
    fontSize: 13,
    fontFamily: FontFamily.semiBold,
  },
});

export default CasesScreen;
