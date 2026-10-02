import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell } from 'lucide-react-native';
import { Colors } from '../theme/colors';

interface HeaderProps {
  title: string;
  role?: string;
  branch?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  role = 'Branch Officer',
  branch = 'Beaumont & Mater branches',
  showBack = false,
  onBack,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.topRow}>
        {showBack ? (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.roleContainer}>
          <View style={styles.roleIcon}>
            <Text style={styles.roleIconText}>⊞</Text>
          </View>
          <Text style={styles.roleText} numberOfLines={1}>
            {role} · {branch}
          </Text>
        </View>

        <TouchableOpacity style={styles.bellButton} activeOpacity={0.7}>
          <Bell size={18} color={Colors.textPrimary} strokeWidth={2} />
          <View style={styles.bellBadge} />
        </TouchableOpacity>
      </View>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 8,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 26,
    color: Colors.textPrimary,
    marginTop: -2,
    lineHeight: 28,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  roleIcon: {
    width: 18,
    height: 18,
    borderRadius: 3,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  roleIconText: {
    fontSize: 9,
    color: Colors.primary,
  },
  roleText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
    flexShrink: 1,
  },
  bellButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  bellBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
});
