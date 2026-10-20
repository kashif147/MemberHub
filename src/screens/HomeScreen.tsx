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
import { Colors, FontFamily, Radii } from '../theme';
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
  const memberCount = useMemo(() => MEMBER_COUNT, []);

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
    borderRadius: Radii.md,
    paddingHorizontal: 12,
    height: 40,
    marginTop: 4,
    marginBottom: 14,
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
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statCardHighlighted: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  statValue: {
    fontFamily: FontFamily.medium,
    fontSize: 24,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: Colors.textMuted,
  },
  driveCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    padding: 14,
    gap: 10,
    marginBottom: 22,
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
    fontSize: 16,
    color: Colors.textPrimary,
  },
  driveStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  driveStat: {
    fontSize: 12,
  },
  driveStatBold: {
    fontFamily: FontFamily.medium,
    color: Colors.textPrimary,
    fontSize: 16,
  },
  driveStatMuted: {
    fontFamily: FontFamily.regular,
    color: Colors.textMuted,
    fontSize: 12,
  },
  registerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: Radii.md,
    minHeight: 40,
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
    marginBottom: 4,
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
});

export default HomeScreen;
