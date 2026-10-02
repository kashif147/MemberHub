import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from 'react-native';
import { Colors } from '../theme/colors';
import { Header } from '../components/Header';

const CASES = [
  {
    id: '1',
    category: 'PAY & CONDITIONS',
    title: 'Unpaid overtime – August roster',
    caseNo: 'CS-24018',
    member: 'Ciarán Doyle',
    date: '12 Sep 2026',
    status: 'In progress',
  },
  {
    id: '2',
    category: 'HEALTH & SAFETY',
    title: 'ED staffing levels on nights',
    caseNo: 'CS-24031',
    member: 'Aoife Brennan',
    date: '22 Sep 2026',
    status: 'Open',
  },
  {
    id: '3',
    category: 'WORKPLACE ISSUE',
    title: 'Annual leave refusal',
    caseNo: 'CS-23977',
    member: 'Maria Santos',
    date: '28 Aug 2026',
    status: 'Closed',
  },
  {
    id: '4',
    category: 'BULLYING & HARASSMENT',
    title: 'Conduct of shift lead',
    caseNo: 'CS-24040',
    member: 'Tomás Walsh',
    date: '26 Sep 2026',
    status: 'Open',
  },
];

const FILTER_TABS = ['All', 'Open', 'In progress', 'Closed'];

type CaseStatus = 'In progress' | 'Open' | 'Closed';

const StatusBadge = ({ status }: { status: CaseStatus }) => {
  const getStyle = () => {
    switch (status) {
      case 'In progress':
        return { bg: Colors.statusInProgressBg, text: Colors.statusInProgress, bordered: false };
      case 'Open':
        return { bg: Colors.surface, text: Colors.primary, bordered: true };
      case 'Closed':
        return { bg: Colors.statusClosedBg, text: Colors.statusClosed, bordered: false };
    }
  };
  const s = getStyle();
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: s.bg, borderWidth: s.bordered ? 1 : 0, borderColor: Colors.border },
      ]}>
      <Text style={[styles.badgeText, { color: s.text }]}>{status}</Text>
    </View>
  );
};

const CaseCard = ({ item }: { item: (typeof CASES)[0] }) => (
  <TouchableOpacity style={styles.caseCard} activeOpacity={0.75}>
    <View style={styles.caseCardHeader}>
      <Text style={styles.caseCategory}>{item.category}</Text>
      <StatusBadge status={item.status as CaseStatus} />
    </View>
    <Text style={styles.caseTitle}>{item.title}</Text>
    <Text style={styles.caseMeta}>
      {item.caseNo} · {item.member} · {item.date}
    </Text>
  </TouchableOpacity>
);

const CasesScreen = () => {
  const [activeTab, setActiveTab] = useState('All');

  const filtered = CASES.filter(
    c => activeTab === 'All' || c.status === activeTab,
  );

  return (
    <View style={styles.screen}>
      <Header title="Cases" />
      <View style={styles.content}>
        {/* Filter Tabs */}
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

        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <CaseCard item={item} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
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
  },
  caseCategory: {
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
