import React, { useCallback, useMemo, useState } from 'react';
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
import { Colors } from '../theme/colors';
import { Header } from '../components/Header';
import { CaseListCard, CaseListRow } from '../components/CaseListRow';
import { loadCasesList } from '../services/issues.services';
import { STACKS } from '../enums/ScreenEnums';
import type { CasesStackParamList } from '../navigation/CasesStack';
import type { CaseItem } from '../data/mockCases';
import type { RootState } from '../store';

const FILTER_TABS = ['All', 'Open', 'In progress', 'Closed'] as const;

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
          <ScrollView
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
            }>
            {filtered.length === 0 ? (
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
            ) : (
              <CaseListCard>
                {filtered.map((item, index) => (
                  <CaseListRow
                    key={item.id}
                    title={item.title}
                    caseNo={item.caseNo}
                    member={item.member}
                    status={item.status}
                    last={index === filtered.length - 1}
                    onPress={() =>
                      navigation.navigate(STACKS.CASE_DETAIL, {
                        issueId: item.id,
                        title: item.caseNo,
                      })
                    }
                  />
                ))}
              </CaseListCard>
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
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
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
});

export default CasesScreen;
