import React, { createContext, useContext, useState, useEffect } from 'react';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('himmel_notifications');
      return saved ? JSON.parse(saved) : [
        {
          id: 1,
          title: 'System Initialized',
          message: 'Himmel Sales Management System started successfully.',
          type: 'info',
          timestamp: new Date().toISOString(),
          read: true
        }
      ];
    } catch (e) {
      return [];
    }
  });

  const [activeToast, setActiveToast] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem('himmel_notifications', JSON.stringify(notifications.slice(0, 50)));
    } catch (e) {
      console.error('Failed to save notifications:', e);
    }
  }, [notifications]);

  const addNotification = (notif) => {
    const newNotif = {
      id: Date.now(),
      title: notif.title || 'System Notification',
      message: notif.message,
      type: notif.type || 'info', // 'info' | 'success' | 'warning' | 'error'
      timestamp: new Date().toISOString(),
      read: false
    };

    setNotifications(prev => [newNotif, ...prev]);
    setActiveToast(newNotif);

    setTimeout(() => {
      setActiveToast(prev => (prev?.id === newNotif.id ? null : prev));
    }, 5000);
  };

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const value = {
    notifications,
    activeToast,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    setActiveToast
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
