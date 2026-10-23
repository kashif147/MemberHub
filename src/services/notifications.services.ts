import {
  clearAllNotificationsRequest,
  fetchNotificationsRequest,
  markNotificationsReadRequest,
} from '../api/notifications.api';
import {
  countUnreadNotifications,
  mergeNotificationLists,
  reconcileBadgeCount,
  type CrmNotification,
} from '../helpers/notificationList.helper';

const assertOk = (res: { status: number; error?: any }, fallback: string) => {
  if (res.status >= 200 && res.status < 300) return;
  const msg =
    res?.error?.error?.message ||
    res?.error?.message ||
    res?.error?.data?.message ||
    fallback;
  throw new Error(typeof msg === 'string' ? msg : fallback);
};

export type NotificationsPage = {
  items: CrmNotification[];
  unreadCount: number;
};

/**
 * Load in-app notifications — ProjectShell-1 UserNotifications.loadList.
 */
export const loadNotifications = async (
  existing: CrmNotification[] = [],
  limit = 100,
): Promise<NotificationsPage> => {
  const res = await fetchNotificationsRequest(limit);
  assertOk(res, 'Failed to load notifications');

  const payload = res.data || {};
  const list = (payload.notifications ||
    payload.items ||
    (Array.isArray(payload) ? payload : [])) as CrmNotification[];
  const serverUnread =
    typeof payload.unreadCount === 'number' ? payload.unreadCount : null;

  const merged = mergeNotificationLists(list, existing);
  return {
    items: merged,
    unreadCount: reconcileBadgeCount(serverUnread, merged),
  };
};

/** Unread badge only (limit=1) — CRM NotificationContext.fetchUnreadCount. */
export const loadUnreadNotificationCount = async (): Promise<number> => {
  try {
    const page = await loadNotifications([], 1);
    return page.unreadCount;
  } catch {
    return 0;
  }
};

export const markNotificationsRead = async (notificationIds: string[]) => {
  const ids = (notificationIds || [])
    .map(id => String(id || '').trim())
    .filter(Boolean);
  if (ids.length === 0) return;
  const res = await markNotificationsReadRequest(ids);
  assertOk(res, 'Could not mark as read');
};

export const clearAllNotifications = async () => {
  const res = await clearAllNotificationsRequest();
  assertOk(res, 'Could not clear notifications');
};

export const markAllUnreadAsRead = async (items: CrmNotification[]) => {
  const unreadIds = (items || [])
    .filter(n => !n?.isRead && !String(n?._id || '').startsWith('local-'))
    .map(n => String(n._id));
  if (unreadIds.length === 0) return;
  await markNotificationsRead(unreadIds);
};

export { countUnreadNotifications };
