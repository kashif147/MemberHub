import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, FontFamily, Radii } from '../theme';
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
    paddingHorizontal: 0,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.transparent,
    gap: 10,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  left: {
    flex: 1,
    marginRight: 0,
    gap: 3,
  },
  title: {
    fontFamily: FontFamily.regular,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  meta: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: Colors.textMuted,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radii.sm + 2,
    flexShrink: 0,
  },
  badgeText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
  },
});

export default CaseListRow;
