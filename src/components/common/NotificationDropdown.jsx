import React, { useState, useRef, useEffect } from 'react';
import { FiBell, FiCheckCircle, FiInfo, FiAlertTriangle, FiXCircle, FiTrash2, FiCheck } from 'react-icons/fi';
import { useNotifications } from '../../context/NotificationContext';

const NotificationDropdown = () => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotifications();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <FiCheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />;
      case 'warning':
        return <FiAlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'error':
        return <FiXCircle className="w-4 h-4 text-red-500 shrink-0" />;
      default:
        return <FiInfo className="w-4 h-4 text-blue-500 shrink-0" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        aria-label="Notifications"
        className="relative p-2.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
      >
        <FiBell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-primary text-white text-[10px] font-bold flex items-center justify-center border-2 border-white dark:border-[#0f172a]">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-slide-up">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-slate-900">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-gray-800 dark:text-white uppercase tracking-wider">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-primary/10 text-brand-primary">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={markAllAsRead}
                className="text-[10px] font-bold text-gray-500 hover:text-brand-primary dark:text-gray-400 transition-colors flex items-center gap-1 cursor-pointer"
                title="Mark all as read"
              >
                <FiCheck className="w-3 h-3" />
                Read All
              </button>
              <button
                onClick={clearNotifications}
                className="text-[10px] font-bold text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                title="Clear all"
              >
                <FiTrash2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400 font-medium italic">
                No notifications right now.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markAsRead(n.id)}
                  className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                    n.read
                      ? 'bg-white dark:bg-[#0f172a] opacity-75'
                      : 'bg-blue-50/40 dark:bg-slate-800/50'
                  } hover:bg-gray-50 dark:hover:bg-slate-800/80`}
                >
                  <div className="mt-0.5">{getIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-bold text-gray-800 dark:text-white truncate">{n.title}</p>
                      <span className="text-[9px] text-gray-400 font-semibold shrink-0 ml-2">
                        {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600 dark:text-slate-300 mt-0.5 leading-relaxed">{n.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
