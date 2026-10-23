import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Bell, CheckCheck, Trash2 } from 'lucide-react-native';
import { Header } from '../../components/Header';
import { useNotificationBadge } from '../../contexts/notificationContext';
import {
  clearAllNotifications,
  loadNotifications,
  markAllUnreadAsRead,
  markNotificationsRead,
} from '../../services/notifications.services';
import {
  formatNotificationTime,
  isLocalNotificationId,
  type CrmNotification,
} from '../../helpers/notificationList.helper';
import { Colors, FontFamily, Radii } from '../../theme';
import type { MoreStackParamList } from '../../navigation/MoreStack';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';

type FilterKey = 'all' | 'unread';

/**
 * MemberHub Notifications — ProjectShell-1 UserNotifications
 * (list / mark-read / delete all via notification-service).
 */
const NotificationsScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const user = useSelector((s: RootState) => s.auth.user);
  const { setUnreadCount, refreshUnreadCount } = useNotificationBadge();

  const [items, setItems] = useState<CrmNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');

  const role = user?.role || 'Branch Officer';
  const branch = user?.branches || 'Beaumont & Mater branches';

  const loadList = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      const page = await loadNotifications([], 100);
      setItems(page.items);
      setUnreadCount(page.unreadCount);
    } catch (e: any) {
      if (!opts?.silent) {
        Alert.alert(
          'Notifications',
          e?.message || 'Failed to load notifications',
        );
      }
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [setUnreadCount]);

  useFocusEffect(
    useCallback(() => {
      loadList();
    }, [loadList]),
  );

  const unreadCount = useMemo(
    () => items.filter(item => !item?.isRead).length,
    [items],
  );

  const filterCounts = useMemo(
    () => ({
      all: items.length,
      unread: unreadCount,
    }),
    [items.length, unreadCount],
  );

  const filteredItems = useMemo(() => {
    if (activeFilter === 'unread') {
      return items.filter(item => !item?.isRead);
    }
    return items;
  }, [activeFilter, items]);

  const onRefresh = () => {
    setRefreshing(true);
    loadList({ silent: true });
  };

  const handleMarkAsRead = async (item: CrmNotification) => {
    const notificationId = String(item?._id || '');
    if (!notificationId || item?.isRead) return;

    const next = items.map(n =>
      String(n._id) === notificationId ? { ...n, isRead: true } : n,
    );
    setItems(next);
    setUnreadCount(Math.max(unreadCount - 1, 0));

    if (isLocalNotificationId(notificationId)) return;

    try {
      await markNotificationsRead([notificationId]);
    } catch (e: any) {
      Alert.alert('Notifications', e?.message || 'Could not mark as read');
      await loadList({ silent: true });
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    const next = items.map(n => ({ ...n, isRead: true }));
    setItems(next);
    setUnreadCount(0);
    try {
      await markAllUnreadAsRead(items);
      await refreshUnreadCount();
    } catch (e: any) {
      Alert.alert(
        'Notifications',
        e?.message || 'Could not mark all as read',
      );
      await loadList({ silent: true });
    }
  };

  const handleClearAll = () => {
    if (items.length === 0 || clearLoading) return;
    Alert.alert(
      'Delete all',
      'Remove all notifications from your inbox?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete all',
          style: 'destructive',
          onPress: async () => {
            setClearLoading(true);
            try {
              await clearAllNotifications();
              setItems([]);
              setUnreadCount(0);
              await loadList({ silent: true });
            } catch (e: any) {
              Alert.alert(
                'Notifications',
                e?.message || 'Could not clear notifications',
              );
            } finally {
              setClearLoading(false);
            }
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: CrmNotification }) => {
    const unread = !item?.isRead;
    const time = formatNotificationTime(item.createdAt || item.sentAt);
    const metaType = item?.metadata?.type;

    return (
      <TouchableOpacity
        style={[styles.row, unread && styles.rowUnread]}
        activeOpacity={0.75}
        onPress={() => handleMarkAsRead(item)}>
        <View style={[styles.iconWrap, unread && styles.iconWrapUnread]}>
          <Bell
            size={18}
            color={unread ? Colors.primary : Colors.textMuted}
            strokeWidth={2.1}
          />
        </View>
        <View style={styles.rowBody}>
          <View style={styles.rowTitleLine}>
            <Text style={styles.rowTitle} numberOfLines={2}>
              {item.title || 'Notification'}
            </Text>
            {unread ? <View style={styles.unreadDot} /> : null}
          </View>
          {item.body ? (
            <Text style={styles.rowBodyText} numberOfLines={3}>
              {item.body}
            </Text>
          ) : null}
          <View style={styles.rowMeta}>
            {time ? <Text style={styles.rowTime}>{time}</Text> : null}
            {metaType ? (
              <Text style={styles.rowType} numberOfLines={1}>
                {String(metaType).replace(/_/g, ' ')}
              </Text>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screen}>
      <Header
        title="Notifications"
        role={role}
        branch={branch}
        showBack
        onBack={() => navigation.goBack()}
        hideBell
      />

      <View style={styles.toolbar}>
        <Text style={styles.subtitle}>
          {unreadCount === 0
            ? 'You are all caught up'
            : `You have ${unreadCount} unread notification${
                unreadCount === 1 ? '' : 's'
              }`}
        </Text>
        <View style={styles.toolbarActions}>
          <TouchableOpacity
            style={styles.toolBtn}
            onPress={handleMarkAllAsRead}
            disabled={unreadCount === 0}
            activeOpacity={0.7}>
            <CheckCheck
              size={16}
              color={
                unreadCount === 0 ? Colors.textPlaceholder : Colors.primary
              }
              strokeWidth={2.2}
            />
            <Text
              style={[
                styles.toolBtnText,
                unreadCount === 0 && styles.toolBtnTextDisabled,
              ]}>
              Mark all read
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.toolBtn}
            onPress={handleClearAll}
            disabled={items.length === 0 || clearLoading}
            activeOpacity={0.7}>
            {clearLoading ? (
              <ActivityIndicator size="small" color={Colors.danger} />
            ) : (
              <Trash2
                size={16}
                color={
                  items.length === 0 ? Colors.textPlaceholder : Colors.danger
                }
                strokeWidth={2.2}
              />
            )}
            <Text
              style={[
                styles.toolBtnTextDanger,
                items.length === 0 && styles.toolBtnTextDisabled,
              ]}>
              Delete all
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.filters}>
        {(['all', 'unread'] as FilterKey[]).map(key => {
          const active = activeFilter === key;
          const label = key === 'all' ? 'All' : 'Unread';
          return (
            <TouchableOpacity
              key={key}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setActiveFilter(key)}
              activeOpacity={0.75}>
              <Text
                style={[
                  styles.filterChipText,
                  active && styles.filterChipTextActive,
                ]}>
                {label} ({filterCounts[key]})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading && items.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item, index) =>
            String(item?._id || `notif-${index}`)
          }
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Bell size={28} color={Colors.textPlaceholder} strokeWidth={1.8} />
              <Text style={styles.emptyTitle}>No notifications</Text>
              <Text style={styles.emptyHint}>
                Updates about cases and members will show up here.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  toolbar: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 10,
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  toolbarActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toolBtnText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: Colors.primary,
  },
  toolBtnTextDanger: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: Colors.danger,
  },
  toolBtnTextDisabled: {
    color: Colors.textPlaceholder,
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radii.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: Radii.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  rowUnread: {
    backgroundColor: Colors.accentSoft,
    borderColor: Colors.accentSoft2,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapUnread: {
    backgroundColor: Colors.primaryLight,
  },
  rowBody: { flex: 1, minWidth: 0, gap: 4 },
  rowTitleLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  rowTitle: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginTop: 5,
  },
  rowBodyText: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textSecondary,
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  rowTime: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: Colors.textMuted,
  },
  rowType: {
    flexShrink: 1,
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: Colors.primary,
    textTransform: 'capitalize',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    paddingTop: 64,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: FontFamily.medium,
    fontSize: 16,
    color: Colors.textPrimary,
    marginTop: 8,
  },
  emptyHint: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});

export default NotificationsScreen;
