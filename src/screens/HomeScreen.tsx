import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../theme/colors';
import { Header } from '../components/Header';
import { STACKS } from '../enums/ScreenEnums';

const StatCard = ({
  value,
  label,
  highlighted,
}: {
  value: number;
  label: string;
  highlighted?: boolean;
}) => (
  <View
    style={[
      styles.statCard,
      highlighted && styles.statCardHighlighted,
    ]}>
    <Text
      style={[
        styles.statValue,
        highlighted && styles.statValueHighlighted,
      ]}>
      {value}
    </Text>
    <Text
      style={[
        styles.statLabel,
        highlighted && styles.statLabelHighlighted,
      ]}>
      {label}
    </Text>
  </View>
);

const CaseItem = ({
  title,
  id,
  member,
  status,
}: {
  title: string;
  id: string;
  member: string;
  status: 'In progress' | 'Open' | 'Closed';
}) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'In progress':
        return { bg: Colors.statusInProgressBg, text: Colors.statusInProgress };
      case 'Open':
        return { bg: Colors.surface, text: Colors.primary };
      case 'Closed':
        return { bg: Colors.statusClosedBg, text: Colors.statusClosed };
    }
  };
  const badge = getBadgeStyle();

  return (
    <View style={styles.caseItem}>
      <View style={styles.caseLeft}>
        <Text style={styles.caseTitle}>{title}</Text>
        <Text style={styles.caseMeta}>
          {id} · {member}
        </Text>
      </View>
      <View
        style={[
          styles.caseBadge,
          {
            backgroundColor: badge.bg,
            borderWidth: status === 'Open' ? 1 : 0,
            borderColor: Colors.border,
          },
        ]}>
        <Text style={[styles.caseBadgeText, { color: badge.text }]}>
          {status}
        </Text>
      </View>
    </View>
  );
};

const HomeScreen = () => {
  const navigation = useNavigation<any>();

  const openMembershipDrive = () => {
    navigation.navigate(STACKS.MEMBERSHIP_DRIVE);
  };

  return (
    <View style={styles.screen}>
      <Header title="Home" />
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Search */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search 8 members"
            placeholderTextColor={Colors.textPlaceholder}
          />
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard value={8} label="Members" />
          <StatCard value={2} label="In arrears" highlighted />
          <StatCard value={1} label="Lapsed" />
        </View>

        {/* Drive Card */}
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
              <Text style={styles.driveStatBold}>3</Text> today
            </Text>
            <Text style={styles.driveStat}>
              {'  '}
              <Text style={styles.driveStatBold}>17</Text> this drive
            </Text>
            <Text style={styles.driveStat}>
              {'  '}
              <Text style={styles.driveStatBold}>4</Text> rejoins
            </Text>
          </View>
          <TouchableOpacity
            style={styles.registerBtn}
            activeOpacity={0.8}
            onPress={openMembershipDrive}>
            <Text style={styles.registerBtnText}>👤+ Register a member</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Cases */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>RECENT CASES</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>View all</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.casesList}>
          <CaseItem
            title="Unpaid overtime – August roster"
            id="CS-24018"
            member="Ciarán Doyle"
            status="In progress"
          />
          <CaseItem
            title="ED staffing levels on nights"
            id="CS-24031"
            member="Aoife Brennan"
            status="Open"
          />
          <CaseItem
            title="Annual leave refusal"
            id="CS-23977"
            member="Maria Santos"
            status="Closed"
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    marginVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  statCardHighlighted: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  statValueHighlighted: {
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '400',
  },
  statLabelHighlighted: {
    color: Colors.textSecondary,
  },
  driveCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  driveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  driveLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  liveBadge: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  liveBadgeText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  driveTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  driveStats: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  driveStat: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  driveStatBold: {
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  registerBtn: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
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
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.8,
  },
  viewAll: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500',
  },
  casesList: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  caseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  caseLeft: {
    flex: 1,
    marginRight: 10,
  },
  caseTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  caseMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  caseBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  caseBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default HomeScreen;
