import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { Search, UserPlus } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { Header } from '../components/Header';
import { CaseListCard, CaseListRow } from '../components/CaseListRow';
import { CASES } from '../data/mockCases';
import { STACKS } from '../enums/ScreenEnums';
import type { RootState } from '../store';

const MEMBER_COUNT = 8;

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

  const role = user?.role || 'Branch Officer';
  const branch = user?.branches || 'Beaumont & Mater branches';
  const memberCount = useMemo(() => {
    // Prefer live scope size when known; fall back to Figma demo count
    return MEMBER_COUNT;
  }, []);

  const openMembershipDrive = () => {
    navigation.navigate(STACKS.MEMBERSHIP_DRIVE);
  };

  const openMembers = () => {
    navigation.getParent()?.navigate(STACKS.MEMBERS);
  };

  const openCases = () => {
    navigation.getParent()?.navigate(STACKS.CASES);
  };

  return (
    <View style={styles.screen}>
      <Header title="Home" role={role} branch={branch} />
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Search — Figma */}
        <View style={styles.searchBar}>
          <Search size={18} color={Colors.textMuted} strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${memberCount} members`}
            placeholderTextColor={Colors.textPlaceholder}
            returnKeyType="search"
            onFocus={openMembers}
          />
        </View>

        {/* Stats — Figma 3 equal cards, In arrears highlighted */}
        <View style={styles.statsRow}>
          <StatCard value={memberCount} label="Members" onPress={openMembers} />
          <StatCard value={2} label="In arrears" highlighted onPress={openMembers} />
          <StatCard value={1} label="Lapsed" onPress={openMembers} />
        </View>

        {/* Drive in progress — Figma */}
        <View style={styles.driveCard}>
          <View style={styles.driveHeader}>
            <Text style={styles.driveLabel}>DRIVE IN PROGRESS</Text>
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

        {/* Recent cases — Figma */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>RECENT CASES</Text>
          <TouchableOpacity onPress={openCases} hitSlop={8}>
            <Text style={styles.viewAll}>View all</Text>
          </TouchableOpacity>
        </View>

        <CaseListCard>
          {CASES.slice(0, 3).map((item, index, arr) => (
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
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    marginTop: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
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
  statCardHighlighted: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
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
  driveCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 18,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  driveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  driveLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.6,
  },
  liveBadge: {
    backgroundColor: Colors.liveBadge,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  liveBadgeText: {
    fontSize: 12,
    color: Colors.liveBadgeText,
    fontWeight: '600',
  },
  driveTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  driveStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 16,
  },
  driveStat: {
    fontSize: 13,
  },
  driveStatBold: {
    fontWeight: '700',
    color: Colors.textPrimary,
    fontSize: 13,
  },
  driveStatMuted: {
    color: Colors.textSecondary,
    fontWeight: '400',
  },
  registerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
  },
  registerBtnText: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.8,
  },
  viewAll: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
});

export default HomeScreen;
