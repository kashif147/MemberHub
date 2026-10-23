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
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { Search, UserPlus } from 'lucide-react-native';
import { Colors, FontFamily, Radii } from '../theme';
import { Header } from '../components/Header';
import { CaseListCard, CaseListRow } from '../components/CaseListRow';
import { loadCasesList } from '../services/issues.services';
import { STACKS } from '../enums/ScreenEnums';
import type { CaseItem } from '../data/mockCases';
import type { RootState } from '../store';

const MEMBER_COUNT = 8;
const RECENT_CASES_LIMIT = 4;

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

  const role = user?.role || 'Branch Officer';
  const branch = user?.branches || 'Beaumont & Mater branches';
  const memberCount = useMemo(() => MEMBER_COUNT, []);

  const loadRecentCases = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setCasesLoading(true);
    setCasesError(null);
    try {
      const rows = await loadCasesList();
      setRecentCases(rows.slice(0, RECENT_CASES_LIMIT));
    } catch (e: any) {
      setCasesError(e?.message || 'Failed to load cases');
      setRecentCases([]);
    } finally {
      setCasesLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRecentCases(false);
    }, [loadRecentCases]),
  );

  const openMembershipDrive = () => {
    navigation.navigate(STACKS.MEMBERSHIP_DRIVE);
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadRecentCases(true)}
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
          <StatCard value={2} label="In arrears" highlighted onPress={openMembers} />
          <StatCard value={1} label="Lapsed" onPress={openMembers} />
        </View>

        <View style={styles.driveCard}>
          <View style={styles.driveHeader}>
            <Text style={styles.driveLabel}>Drive in progress</Text>
            <View style={styles.liveBadge}>
              <Text style={styles.liveBadgeText}>Live</Text>
            </View>
          </View>
          <Text style={styles.driveTitle}>Beaumont ED – Autumn drive</Text>
          <View style={styles.driveStats}>
            <Text style={styles.driveStat}>
              <Text style={styles.driveStatBold}>3</Text>
              <Text style={styles.driveStatMuted}> today</Text>
            </Text>
            <Text style={styles.driveStat}>
              <Text style={styles.driveStatBold}>17</Text>
              <Text style={styles.driveStatMuted}> this drive</Text>
            </Text>
            <Text style={styles.driveStat}>
              <Text style={styles.driveStatBold}>4</Text>
              <Text style={styles.driveStatMuted}> rejoins</Text>
            </Text>
          </View>
          <TouchableOpacity
            style={styles.registerBtn}
            activeOpacity={0.8}
            onPress={openMembershipDrive}>
            <UserPlus size={18} color={Colors.primary} strokeWidth={2.2} />
            <Text style={styles.registerBtnText}>Register a member</Text>
          </TouchableOpacity>
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
