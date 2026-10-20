import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Phone, FolderPlus } from 'lucide-react-native';
import { Colors, FontFamily, Radii } from '../../theme';
import { getMemberById } from '../../data/mockMembers';
import { getCasesForMember } from '../../data/mockCases';
import { Header } from '../../components/Header';
import { STACKS } from '../../enums/ScreenEnums';
import type { Member } from '../../data/mockMembers';

type RouteParams = {
  MemberDetail: { memberId: string; member?: Member };
};

type TabKey = 'Overview' | 'History' | 'Cases';

const StatusBadge = ({
  status,
  bordered,
}: {
  status: string;
  bordered?: boolean;
}) => (
  <View
    style={[
      styles.badge,
      bordered && styles.badgeBordered,
      status === 'In progress' && { backgroundColor: Colors.statusInProgressBg },
      status === 'Closed' && { backgroundColor: Colors.statusClosedBg },
      status === 'Open' && { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.primary },
    ]}>
    <Text
      style={[
        styles.badgeText,
        status === 'Closed'
          ? { color: Colors.statusClosed }
          : { color: Colors.primary },
      ]}>
      {status}
    </Text>
  </View>
);

const MemberDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'MemberDetail'>>();
  const insets = useSafeAreaInsets();
  const memberId = route.params?.memberId;
  const member = useMemo(
    () => route.params?.member || getMemberById(memberId),
    [memberId, route.params?.member],
  );
  const memberCases = useMemo(
    () => getCasesForMember(memberId),
    [memberId],
  );
  const [tab, setTab] = useState<TabKey>('History');

  if (!member) {
    return (
      <View style={styles.screen}>
        <Header title="Member" showBack onBack={() => navigation.goBack()} />
        <Text style={styles.missing}>Member not found</Text>
      </View>
    );
  }

  const hasArrears = Boolean(member.arrears);

  const attention = useMemo(() => {
    if (hasArrears) {
      return {
        title: `${member.paymentMethod === 'Direct debit' ? 'Direct debit failed. ' : 'Payroll deduction stopped. '}${member.arrears} outstanding.`,
        cta: 'Send payment reminder',
      };
    }
    if (member.status === 'Lapsed') {
      return {
        title: `Membership lapsed. No payment since ${member.lastPaid || '01 Mar 2026'}.`,
        cta: 'Start rejoin application',
      };
    }
    if (member.status === 'Resigned') {
      return {
        title: 'Resigned. Can rejoin through a new application.',
        cta: 'Start rejoin application',
      };
    }
    return null;
  }, [hasArrears, member]);

  const overviewRows = useMemo(() => [
    { label: 'Grade', value: member.grade || member.role || 'CNM2' },
    { label: 'Work location', value: member.workLocation || `${member.branch} Hospital – ED` },
    { label: 'Branch', value: member.branch || 'Beaumont' },
    { label: 'Region', value: member.region || 'Dublin North East' },
    { label: 'Category', value: member.category || 'General (all grades)' },
    { label: 'Member since', value: member.joined || 'Jun 2011' },
    { label: 'Mobile', value: member.phone || '086 551 9021' },
  ], [member]);

  const historyItems = useMemo(() => {
    const items: Array<{
      date: string;
      title: string;
      sub: string;
      activeDot?: boolean;
    }> = [];

    if (hasArrears) {
      items.push({
        date: 'Sep 2026',
        title: member.paymentMethod === 'Direct debit' ? 'Direct debit failed' : 'Payroll deduction stopped',
        sub: `${member.arrears} outstanding`,
        activeDot: true,
      });
    } else if (member.status === 'Lapsed') {
      items.push({
        date: '2026',
        title: 'Membership lapsed',
        sub: `No payment since ${member.lastPaid || '01 Mar 2026'}`,
        activeDot: true,
      });
    } else if (member.status === 'Resigned') {
      items.push({
        date: 'Feb 2026',
        title: 'Resigned',
        sub: 'Left the service',
        activeDot: true,
      });
    }

    memberCases.forEach(c => {
      const dateSlice = c.date ? c.date.replace(/^\d+\s+/, '') : 'Sep 2026';
      const formattedCategory = c.category
        .toLowerCase()
        .replace(/\b\w/g, ch => ch.toUpperCase());
      items.push({
        date: dateSlice,
        title: `Case ${c.caseNo} · ${c.status.toLowerCase()}`,
        sub: formattedCategory,
        activeDot: false,
      });
    });

    items.push({
      date: 'Last paid',
      title: 'Payment received',
      sub: `${member.lastPaid || '01 Jul 2026'} · ${member.paymentMethod || 'Direct debit'}`,
      activeDot: false,
    });

    items.push({
      date: member.joined || 'Jun 2011',
      title: 'Joined',
      sub: `General (all grades) · ${member.grade || member.role || 'CNM2'}`,
      activeDot: false,
    });

    return items;
  }, [hasArrears, member, memberCases]);

  return (
    <View style={styles.screen}>
      <Header title="Member" showBack onBack={() => navigation.goBack()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 84 },
        ]}>
        {/* Profile Header */}
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{member.initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{member.name}</Text>
            <Text style={styles.meta}>
              {member.memberNo} · {member.grade || member.role} · {member.branch}
            </Text>
          </View>
        </View>

        {/* Needs Attention Banner */}
        {attention && (
          <View style={styles.attentionCard}>
            <Text style={styles.attentionLabel}>NEEDS ATTENTION</Text>
            <Text style={styles.attentionTitle}>{attention.title}</Text>
            <TouchableOpacity style={styles.attentionBtn} activeOpacity={0.8}>
              <Text style={styles.attentionBtnText}>{attention.cta}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Membership & Payment Summary Row */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>MEMBERSHIP</Text>
            <Text style={styles.summaryValue}>{member.status}</Text>
            <Text style={styles.summarySub}>since {member.joined || 'Jun 2011'}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>PAYMENT</Text>
            <Text style={styles.summaryValue}>
              {hasArrears ? `${member.arrears} due` : member.status === 'Lapsed' ? 'Lapsed' : 'Paid up'}
            </Text>
            <Text style={styles.summarySub}>
              {member.paymentMethod || 'Direct debit'}
            </Text>
          </View>
        </View>

        {/* Tabs Bar */}
        <View style={styles.tabs}>
          {(['Overview', 'History', 'Cases'] as TabKey[]).map(key => {
            const label =
              key === 'Cases' ? `Cases · ${memberCases.length}` : key;
            const active = tab === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.tab, active && styles.tabActive]}
                onPress={() => setTab(key)}
                activeOpacity={0.7}>
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Overview Tab Content */}
        {tab === 'Overview' && (
          <View style={styles.overviewContainer}>
            {overviewRows.map(row => (
              <View key={row.label} style={styles.overviewRow}>
                <Text style={styles.overviewLabel}>{row.label}</Text>
                <Text style={styles.overviewValue}>{row.value}</Text>
              </View>
            ))}
          </View>
        )}

        {/* History Tab Content */}
        {tab === 'History' && (
          <View style={styles.timelineContainer}>
            {historyItems.map((item, index) => {
              const isLast = index === historyItems.length - 1;
              return (
                <View key={`${item.title}-${index}`} style={styles.timelineRow}>
                  <Text style={styles.timelineDate}>{item.date}</Text>

                  <View style={styles.timelineNodeCol}>
                    <View
                      style={[
                        styles.timelineRing,
                        item.activeDot
                          ? styles.timelineRingActive
                          : styles.timelineRingDefault,
                      ]}
                    />
                    {!isLast && <View style={styles.timelineLine} />}
                  </View>

                  <View
                    style={[
                      styles.timelineBody,
                      !isLast && styles.timelineBodySpaced,
                    ]}>
                    <Text style={styles.timelineTitle}>{item.title}</Text>
                    <Text style={styles.timelineSub}>{item.sub}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Cases Tab Content */}
        {tab === 'Cases' && (
          <View style={styles.casesContainer}>
            {memberCases.length === 0 ? (
              <Text style={styles.emptyCasesText}>No cases on record.</Text>
            ) : (
              memberCases.map(c => {
                const formattedCategory = c.category
                  .toLowerCase()
                  .replace(/\b\w/g, ch => ch.toUpperCase());
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={styles.caseRow}
                    activeOpacity={0.7}
                    onPress={() =>
                      navigation.getParent()?.navigate(STACKS.CASES, {
                        screen: STACKS.CASE_DETAIL,
                        params: { caseItem: c },
                      })
                    }>
                    <View style={styles.caseHeader}>
                      <Text style={styles.caseTitle}>{c.title}</Text>
                      <StatusBadge
                        status={c.status}
                        bordered={c.status === 'Open'}
                      />
                    </View>
                    <Text style={styles.caseMeta}>
                      {c.caseNo} · {formattedCategory} · {c.date}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* Fixed Bottom Action Bar */}
      <View
        style={[
          styles.bottomActionsBar,
          { paddingBottom: Math.max(insets.bottom, 12) },
        ]}>
        <TouchableOpacity style={styles.bottomBtnCall} activeOpacity={0.7}>
          <Phone size={16} color={Colors.textPrimary} strokeWidth={2} />
          <Text style={styles.bottomBtnCallText}>Call</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.bottomBtnNewCase}
          activeOpacity={0.7}
          onPress={() =>
            navigation.getParent()?.navigate(STACKS.CASES, {
              screen: STACKS.NEW_CASE,
              params: { memberId: member.id },
            })
          }>
          <FolderPlus size={16} color={Colors.primary} strokeWidth={2} />
          <Text style={styles.bottomBtnNewCaseText}>New case</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  missing: {
    marginTop: 40,
    textAlign: 'center',
    color: Colors.textSecondary,
    fontFamily: FontFamily.medium,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
    marginTop: 4,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: FontFamily.medium,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: FontFamily.medium,
    letterSpacing: -0.3,
  },
  meta: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: FontFamily.medium,
    marginTop: 4,
  },
  attentionCard: {
    backgroundColor: '#FAF9FF',
    borderColor: '#D8D3F3',
    borderWidth: 1.5,
    borderRadius: Radii.lg,
    padding: 16,
    marginBottom: 12,
  },
  attentionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
    fontFamily: FontFamily.medium,
  },
  attentionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 20,
    marginBottom: 10,
    fontFamily: FontFamily.medium,
  },
  attentionBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
  },
  attentionBtnText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 14,
    fontFamily: FontFamily.medium,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.primary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
    fontFamily: FontFamily.medium,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
    fontFamily: FontFamily.medium,
  },
  summarySub: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: FontFamily.medium,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 4,
  },
  tab: {
    paddingVertical: 10,
    marginRight: 22,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
    marginBottom: -1,
  },
  tabText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
    fontFamily: FontFamily.medium,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  overviewContainer: {
    paddingTop: 2,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  overviewLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: FontFamily.medium,
  },
  overviewValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontFamily: FontFamily.medium,
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  timelineContainer: {
    paddingTop: 10,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineDate: {
    width: 64,
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: FontFamily.medium,
    paddingTop: 1,
  },
  timelineNodeCol: {
    width: 16,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  timelineRing: {
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 1.5,
    backgroundColor: Colors.surface,
    marginTop: 4,
  },
  timelineRingActive: {
    borderColor: Colors.primary,
  },
  timelineRingDefault: {
    borderColor: '#9CA3AF',
  },
  timelineLine: {
    flex: 1,
    width: 1,
    backgroundColor: Colors.border,
    marginTop: 4,
  },
  timelineBody: {
    flex: 1,
    paddingLeft: 12,
  },
  timelineBodySpaced: {
    paddingBottom: 22,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontFamily: FontFamily.medium,
    lineHeight: 18,
  },
  timelineSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 3,
    fontFamily: FontFamily.medium,
    lineHeight: 16,
  },
  casesContainer: {
    paddingTop: 4,
  },
  caseRow: {
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  caseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  caseTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontFamily: FontFamily.medium,
  },
  caseMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: FontFamily.medium,
  },
  emptyCasesText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: FontFamily.medium,
    paddingVertical: 16,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: Colors.statusInProgressBg,
    alignSelf: 'flex-start',
  },
  badgeBordered: {
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: FontFamily.medium,
  },
  bottomActionsBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  bottomBtnCall: {
    flex: 1,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  bottomBtnCallText: {
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: 14,
    fontFamily: FontFamily.medium,
  },
  bottomBtnNewCase: {
    flex: 1,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  bottomBtnNewCaseText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 14,
    fontFamily: FontFamily.medium,
  },
});

export default MemberDetailScreen;
