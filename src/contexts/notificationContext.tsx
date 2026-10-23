import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useSelector } from 'react-redux';
import { loadUnreadNotificationCount } from '../services/notifications.services';
import type { RootState } from '../store';

type NotificationContextValue = {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  refreshUnreadCount: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue>({
  unreadCount: 0,
  setUnreadCount: () => undefined,
  refreshUnreadCount: async () => undefined,
});

export const NotificationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const isSignedIn = useSelector((s: RootState) => s.auth.isSignedIn);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    if (!isSignedIn) {
      setUnreadCount(0);
      return;
    }
    const count = await loadUnreadNotificationCount();
    setUnreadCount(count);
  }, [isSignedIn]);

  useEffect(() => {
    if (!isSignedIn) {
      setUnreadCount(0);
      return;
    }
    refreshUnreadCount();
  }, [isSignedIn, refreshUnreadCount]);

  const value = useMemo(
    () => ({ unreadCount, setUnreadCount, refreshUnreadCount }),
    [unreadCount, refreshUnreadCount],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationBadge = () => useContext(NotificationContext);
