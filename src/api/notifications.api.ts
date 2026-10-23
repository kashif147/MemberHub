import { createAuthedClient } from './createClient';
import { NOTIFICATION_SERVICE_URL } from '../constants/config';

/**
 * ProjectShell-1 UserNotifications / NotificationPopover endpoints
 * against notification-service/api.
 */
const client = createAuthedClient(NOTIFICATION_SERVICE_URL);

const unwrap = (res: any) => res?.data?.data ?? res?.data ?? res;

/** GET /notifications?limit= — same as CRM UserNotifications.loadList */
export const fetchNotificationsRequest = async (limit = 100) => {
  const res = await client.get('/notifications', { params: { limit } });
  return {
    status: res.status,
    data: unwrap(res),
    error: res.data,
  };
};

/**
 * POST /firebase/notifications/mark-read
 * Body: { notificationIds: string[] } — CRM NotificationPopover / UserNotifications.
 */
export const markNotificationsReadRequest = async (
  notificationIds: string[],
) => {
  const res = await client.post('/firebase/notifications/mark-read', {
    notificationIds,
  });
  return {
    status: res.status,
    data: unwrap(res),
    error: res.data,
  };
};

/** DELETE /firebase/notifications — clear all (CRM UserNotifications). */
export const clearAllNotificationsRequest = async () => {
  const res = await client.delete('/firebase/notifications');
  return {
    status: res.status,
    data: unwrap(res),
    error: res.data,
  };
};
