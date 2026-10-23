/**
 * Port of ProjectShell-1 src/utils/notificationListUtils.js
 * for merging list + badge reconciliation.
 */

export type CrmNotification = {
  _id: string;
  title?: string;
  body?: string;
  isRead?: boolean;
  createdAt?: string;
  sentAt?: string;
  metadata?: Record<string, any>;
  [key: string]: any;
};

export const isLocalNotificationId = (id?: string | null) =>
  String(id || '').startsWith('local-');

/**
 * Merge server-fetched notifications with in-memory rows
 * (local batch alerts, socket rows not yet returned by the API).
 */
export const mergeNotificationLists = (
  serverList: CrmNotification[] | null | undefined,
  existingList: CrmNotification[] = [],
): CrmNotification[] => {
  const server = Array.isArray(serverList) ? serverList : [];
  const existing = Array.isArray(existingList) ? existingList : [];
  const merged = new Map<string, CrmNotification>();

  for (const item of server) {
    const id = String(item?._id || '');
    if (id) merged.set(id, item);
  }

  for (const item of existing) {
    const id = String(item?._id || '');
    if (!id || merged.has(id)) continue;
    merged.set(id, item);
  }

  return Array.from(merged.values()).sort(
    (a, b) =>
      new Date(b.createdAt || b.sentAt || 0).getTime() -
      new Date(a.createdAt || a.sentAt || 0).getTime(),
  );
};

export const countUnreadNotifications = (
  list: CrmNotification[] | null | undefined,
) => (Array.isArray(list) ? list : []).filter(item => !item?.isRead).length;

export const reconcileBadgeCount = (
  serverUnreadCount: number | undefined | null,
  mergedList: CrmNotification[],
) => {
  if (typeof serverUnreadCount !== 'number') {
    return countUnreadNotifications(mergedList);
  }
  const localUnread = (mergedList || []).filter(
    item => isLocalNotificationId(item?._id) && !item?.isRead,
  ).length;
  return serverUnreadCount + localUnread;
};

/** Relative time for list rows (en-IE). */
export const formatNotificationTime = (raw?: string | null) => {
  if (!raw) return '';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '';
  const diffMs = Date.now() - d.getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 45) return 'Just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return d.toLocaleDateString('en-IE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};
