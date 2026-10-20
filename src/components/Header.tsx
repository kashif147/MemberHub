import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, ChevronLeft, LayoutGrid } from 'lucide-react-native';
import { Colors, FontFamily, Radii } from '../theme';

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
  const topPadding = Math.max(insets.top, 24) + 8;

  if (showBack) {
    return (
      <View style={[styles.container, { paddingTop: topPadding }]}>
        <View style={styles.backHeaderRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <ChevronLeft size={20} color={Colors.textPrimary} strokeWidth={2.2} />
          </TouchableOpacity>

          <View style={styles.backCenterCol}>
            <View style={styles.roleContainer}>
              <View style={styles.roleIcon}>
                <LayoutGrid size={11} color={Colors.primary} strokeWidth={2.4} />
              </View>
              <Text
                style={styles.roleText}
                numberOfLines={1}
                ellipsizeMode="tail">
                {role} · {branch}
              </Text>
            </View>
            <Text style={styles.titleWithBack} numberOfLines={1}>
              {title}
            </Text>
          </View>

          <TouchableOpacity style={styles.bellButton} activeOpacity={0.7}>
            <Bell size={18} color={Colors.textPrimary} strokeWidth={2} />
            <View style={styles.bellBadge} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.topRow}>
        <View style={styles.roleContainer}>
          <View style={styles.roleIcon}>
            <LayoutGrid size={11} color={Colors.primary} strokeWidth={2.4} />
          </View>
          <Text
            style={styles.roleText}
            numberOfLines={1}
            ellipsizeMode="tail">
            {role} · {branch}
          </Text>
        </View>
      </View>

      <View style={styles.titleRow}>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity style={styles.bellButton} activeOpacity={0.7}>
          <Bell size={18} color={Colors.textPrimary} strokeWidth={2} />
          <View style={styles.bellBadge} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backCenterCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    marginBottom: 2,
    paddingTop: 2,
  },
  roleIcon: {
    width: 18,
    height: 18,
    borderRadius: Radii.sm,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    flexShrink: 0,
  },
  roleText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.primary,
    flexShrink: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: 30,
    color: Colors.textPrimary,
    letterSpacing: -0.45,
  },
  titleWithBack: {
    fontFamily: FontFamily.medium,
    fontSize: 26,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  bellButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
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
});
