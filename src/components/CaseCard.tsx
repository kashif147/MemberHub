import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../theme/colors';
import type { CaseItem, CaseStatus } from '../data/mockCases';

const badgeStyle = (status: CaseStatus) => {
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

type Props = {
  item: CaseItem;
  onPress?: () => void;
};

/** Figma Cases tab card — category, status, title, CS · member · date. */
export const CaseCard = ({ item, onPress }: Props) => {
  const badge = badgeStyle(item.status);
  const meta = [item.caseNo, item.member, item.date]
    .map(v => String(v || '').trim())
    .filter(Boolean)
    .join(' · ');

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.75}
      disabled={!onPress}>
      <View style={styles.topRow}>
        <Text style={styles.category} numberOfLines={1}>
          {item.category || 'CASE'}
        </Text>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: badge.bg,
              borderWidth: badge.bordered ? 1 : 0,
              borderColor: Colors.primary,
            },
          ]}>
          <Text style={[styles.badgeText, { color: badge.text }]}>
            {item.status}
          </Text>
        </View>
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {item.title}
      </Text>
      {meta ? (
        <Text style={styles.meta} numberOfLines={1}>
          {meta}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 8,
  },
  category: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.6,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 7,
    flexShrink: 0,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  meta: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '400',
  },
});

export default CaseCard;
