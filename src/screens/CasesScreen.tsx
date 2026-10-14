import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { Colors } from '../theme/colors';
import { Header } from '../components/Header';
import { loadCasesList } from '../services/issues.services';
import { STACKS } from '../enums/ScreenEnums';
import type { CasesStackParamList } from '../navigation/CasesStack';
import type { CaseItem, CaseStatus } from '../data/mockCases';
import type { RootState } from '../store';

const FILTER_TABS = ['All', 'Open', 'In progress', 'Closed'] as const;

const StatusBadge = ({ status }: { status: CaseStatus }) => {
  const getStyle = () => {
    switch (status) {
      case 'In progress':
        return {
          bg: Colors.statusInProgressBg,
          text: Colors.statusInProgress,
          bordered: false,
        };
      case 'Open':
        return {
          bg: Colors.surface,
          text: Colors.primary,
          bordered: true,
        };
      case 'Closed':
        return {
          bg: Colors.statusClosedBg,
          text: Colors.statusClosed,
          bordered: false,
        };
    }
  };
  const s = getStyle();
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: s.bg,
          borderWidth: s.bordered ? 1 : 0,
          borderColor: Colors.border,
        },
      ]}>
      <Text style={[styles.badgeText, { color: s.text }]}>{status}</Text>
    </View>
  );
};

const CaseCard = ({
  item,
  onPress,
}: {
  item: CaseItem;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={styles.caseCard}
    activeOpacity={0.75}
    onPress={onPress}>
    <View style={styles.caseCardHeader}>
      <Text style={styles.caseCategory} numberOfLines={1}>
        {item.category}
      </Text>
      <StatusBadge status={item.status} />
    </View>
    <Text style={styles.caseTitle} numberOfLines={2}>
      {item.title}
    </Text>
    <Text style={styles.caseMeta} numberOfLines={1}>
      {item.caseNo} · {item.member} · {item.date}
    </Text>
  </TouchableOpacity>
);

const CasesScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<CasesStackParamList>>();
  const user = useSelector((s: RootState) => s.auth.user);
  const [activeTab, setActiveTab] = useState<(typeof FILTER_TABS)[number]>('All');
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const role = user?.role || 'Branch Officer';
  const branch = user?.branches || 'Beaumont & Mater branches';

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const rows = await loadCasesList();
      setCases(rows);
    } catch (e: any) {
      setError(e?.message || 'Failed to load cases');
      setCases([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(false);
    }, [load]),
  );

  const filtered = useMemo(
    () =>
      cases.filter(c => activeTab === 'All' || c.status === activeTab),
    [cases, activeTab],
  );

  return (
    <View style={styles.screen}>
      <Header title="Cases" role={role} branch={branch} />
      <View style={styles.content}>
        <View style={styles.tabRow}>
          {FILTER_TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.7}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.tabTextActive,
                ]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.centerText}>Loading cases…</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <CaseCard
                item={item}
                onPress={() =>
                  navigation.navigate(STACKS.CASE_DETAIL, {
                    issueId: item.id,
                    title: item.caseNo,
                  })
                }
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.listContent,
              filtered.length === 0 && styles.listEmpty,
            ]}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => load(true)}
                tintColor={Colors.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={styles.centerText}>
                  {error ||
                    (activeTab === 'All'
                      ? 'No cases yet.'
                      : `No ${activeTab.toLowerCase()} cases.`)}
                </Text>
                {error ? (
                  <TouchableOpacity
                    style={styles.retryBtn}
                    onPress={() => load(false)}
                    activeOpacity={0.8}>
                    <Text style={styles.retryText}>Retry</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            }
          />
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
    paddingTop: 14,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
  tabText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  listContent: {
    gap: 12,
    paddingBottom: 30,
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
    fontWeight: '700',
    fontSize: 13,
  },
  caseCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  caseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  caseCategory: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  caseTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  caseMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});

export default CasesScreen;
