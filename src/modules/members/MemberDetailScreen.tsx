import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Colors } from '../../theme/colors';
import { getMemberById } from '../../data/mockMembers';
import { getCasesForMember } from '../../data/mockCases';
import { Header } from '../../components/Header';
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
      status === 'Open' && { backgroundColor: Colors.surface },
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

  return (
    <View style={styles.screen}>
      <Header title="Member" showBack onBack={() => navigation.goBack()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{member.initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{member.name}</Text>
            <Text style={styles.meta}>
              {member.memberNo} · {member.role} · {member.branch}
            </Text>
          </View>
        </View>

        {hasArrears && (
          <View style={styles.attentionCard}>
            <Text style={styles.attentionLabel}>NEEDS ATTENTION</Text>
            <Text style={styles.attentionTitle}>
              Direct debit failed. {member.arrears} outstanding.
            </Text>
            <TouchableOpacity style={styles.attentionBtn} activeOpacity={0.8}>
              <Text style={styles.attentionBtnText}>Send payment reminder</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>MEMBERSHIP</Text>
            <Text style={styles.summaryValue}>{member.status}</Text>
            <Text style={styles.summarySub}>since {member.joined || '—'}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>PAYMENT</Text>
            <Text style={styles.summaryValue}>
              {hasArrears ? `${member.arrears} due` : 'Up to date'}
            </Text>
            <Text style={styles.summarySub}>
              {member.paymentMethod || 'Direct debit'}
            </Text>
          </View>
        </View>

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

        {tab === 'Overview' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile</Text>
            <Text style={styles.bodyLine}>Grade: {member.grade || '—'}</Text>
            <Text style={styles.bodyLine}>Branch: {member.branch}</Text>
            <Text style={styles.bodyLine}>Role: {member.role}</Text>
            <Text style={styles.bodyLine}>Status: {member.status}</Text>
          </View>
        )}

        {tab === 'History' && (
          <View style={styles.timeline}>
            {hasArrears && (
              <View style={styles.timelineItem}>
                <View style={[styles.dot, styles.dotActive]} />
                <View style={styles.timelineBody}>
                  <Text style={styles.timelineDate}>Sep 2026</Text>
                  <Text style={styles.timelineTitle}>Direct debit failed</Text>
                  <Text style={styles.timelineSub}>
                    {member.arrears} outstanding
                  </Text>
                </View>
              </View>
            )}
            {memberCases.map(c => (
              <View key={c.id} style={styles.timelineItem}>
                <View style={styles.dot} />
                <View style={styles.timelineBody}>
                  <Text style={styles.timelineDate}>{c.date}</Text>
                  <Text style={styles.timelineTitle}>
                    Case {c.caseNo} · {c.status.toLowerCase()}
                  </Text>
                  <Text style={styles.timelineSub}>{c.category}</Text>
                </View>
              </View>
            ))}
            <View style={styles.timelineItem}>
              <View style={styles.dot} />
              <View style={styles.timelineBody}>
                <Text style={styles.timelineDate}>Last paid</Text>
                <Text style={styles.timelineTitle}>Payment received</Text>
                <Text style={styles.timelineSub}>
                  01 Jul 2026 · Direct debit
                </Text>
              </View>
            </View>
            <View style={[styles.timelineItem, { borderLeftWidth: 0 }]}>
              <View style={styles.dot} />
              <View style={styles.timelineBody}>
                <Text style={styles.timelineDate}>{member.joined}</Text>
                <Text style={styles.timelineTitle}>Joined</Text>
                <Text style={styles.timelineSub}>
                  {member.grade} · {member.role}
                </Text>
              </View>
            </View>
          </View>
        )}

        {tab === 'Cases' && (
          <View style={styles.section}>
            {memberCases.length === 0 ? (
              <Text style={styles.bodyLine}>No cases for this member.</Text>
            ) : (
              memberCases.map(c => (
                <View key={c.id} style={styles.caseCard}>
                  <View style={styles.caseHeader}>
                    <Text style={styles.caseTitle}>{c.title}</Text>
                    <StatusBadge
                      status={c.status}
                      bordered={c.status === 'Open'}
                    />
                  </View>
                  <Text style={styles.caseMeta}>
                    {c.caseNo} · {c.category} · {c.date}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8}>
            <Text style={styles.actionText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8}>
            <Text style={styles.actionText}>New case</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  missing: {
    marginTop: 40,
    textAlign: 'center',
    color: Colors.textSecondary,
  },
  content: { paddingHorizontal: 16, paddingBottom: 120 },
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
  avatarText: { fontSize: 18, fontWeight: '700', color: Colors.primary },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  meta: { fontSize: 13, color: Colors.textSecondary },
  attentionCard: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  attentionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  attentionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  attentionBtn: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  attentionBtnText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  summarySub: { fontSize: 12, color: Colors.textSecondary },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 14,
  },
  tab: { paddingVertical: 10, marginRight: 18 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  tabText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  tabTextActive: { color: Colors.primary, fontWeight: '700' },
  section: { gap: 8 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  bodyLine: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  timeline: { paddingLeft: 6 },
  timelineItem: {
    flexDirection: 'row',
    paddingBottom: 18,
    borderLeftWidth: 1.5,
    borderLeftColor: Colors.border,
    marginLeft: 6,
    paddingLeft: 16,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.border,
    position: 'absolute',
    left: -5.5,
    top: 4,
  },
  dotActive: { backgroundColor: Colors.primary },
  timelineBody: { flex: 1 },
  timelineDate: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  timelineSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  caseCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  caseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  caseTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  caseMeta: { fontSize: 12, color: Colors.textSecondary },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: Colors.statusInProgressBg,
    alignSelf: 'flex-start',
  },
  badgeBordered: {
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
  badgeText: { fontSize: 11, fontWeight: '600' },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  actionBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  actionText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
});

export default MemberDetailScreen;
