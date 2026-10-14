import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../theme/colors';
import type { CaseStatus } from '../data/mockCases';

type Props = {
  title: string;
  caseNo: string;
  member: string;
  status: CaseStatus;
  last?: boolean;
  onPress?: () => void;
};

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

/** Figma recent-cases / cases list row — title, CS · name, status pill. */
export const CaseListRow = ({
  title,
  caseNo,
  member,
  status,
  last,
  onPress,
}: Props) => {
  const badge = badgeStyle(status);
  const meta = [caseNo, member].filter(Boolean).join(' · ');

  const content = (
    <>
      <View style={styles.left}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {meta ? (
          <Text style={styles.meta} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
      </View>
      <View
        style={[
          styles.badge,
          {
            backgroundColor: badge.bg,
            borderWidth: badge.bordered ? 1.5 : 0,
            borderColor: Colors.primary,
          },
        ]}>
        <Text style={[styles.badgeText, { color: badge.text }]}>{status}</Text>
      </View>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.row, last && styles.rowLast]}
        onPress={onPress}
        activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.row, last && styles.rowLast]}>{content}</View>;
};

/** Wrapper for case rows (no fill — sits on app background). */
export const CaseListCard = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.card}>{children}</View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.transparent,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 22,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.transparent,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  left: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.1,
  },
  meta: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '400',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    flexShrink: 0,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default CaseListRow;
