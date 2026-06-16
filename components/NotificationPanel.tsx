/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bell, AlertCircle, CheckCircle, Info } from 'lucide-react';
import type { NotificationItem } from '@/lib/types';

interface NotificationPanelProps {
  isOpen?: boolean;
  onClose?: () => void;
  notifications?: NotificationItem[];
  onMarkAsRead?: (id: string) => void;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'booking':
      return CheckCircle;
    case 'reminder':
      return Bell;
    case 'reschedule':
      return AlertCircle;
    case 'emergency':
      return AlertCircle;
    default:
      return Info;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'booking':
      return 'bg-emerald-500/20 border-emerald-500/50 text-emerald-700';
    case 'reminder':
      return 'bg-blue-500/20 border-blue-500/50 text-blue-700';
    case 'reschedule':
      return 'bg-orange-500/20 border-orange-500/50 text-orange-700';
    case 'emergency':
      return 'bg-red-500/20 border-red-500/50 text-red-700';
    default:
      return 'bg-gray-500/20 border-gray-500/50 text-gray-700';
  }
};

export function NotificationPanel({
  isOpen = false,
  onClose,
  notifications = [],
  onMarkAsRead,
}: NotificationPanelProps) {
  const [local, setLocal] = useState(notifications);

  useEffect(() => {
    setLocal(notifications);
  }, [notifications]);

  const unreadCount = local.filter((n) => !n.read).length;

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            className="fixed right-0 top-0 h-screen w-full max-w-md bg-background border-l border-border shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="border-b border-border px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">Notifications</h2>
                {unreadCount > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {unreadCount} unread
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-card rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {local.length > 0 ? (
                local.map((notification, idx) => {
                  const Icon = getNotificationIcon(notification.type);
                  const colorClass = getNotificationColor(notification.type);

                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`p-4 rounded-xl border ${colorClass} cursor-pointer hover:shadow-md transition-all`}
                      onClick={() => {
                        if (!notification.read) {
                          onMarkAsRead?.(notification.id);
                          setLocal(
                            local.map((n) =>
                              n.id === notification.id ? { ...n, read: true } : n
                            )
                          );
                        }
                      }}
                    >
                      <div className="flex gap-3">
                        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium">{notification.message}</p>
                          <p className="text-xs opacity-75 mt-1">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                          {!notification.read && (
                            <div className="mt-2 text-xs font-medium opacity-75">
                              • Unread
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                  <Bell className="w-12 h-12 text-muted-foreground opacity-20 mb-3" />
                  <p className="text-muted-foreground">
                    No notifications yet
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            {unreadCount > 0 && (
              <div className="border-t border-border px-6 py-4">
                <button className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:shadow-lg transition-all">
                  Mark all as read
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* Badge Component for showing notification count */
export function NotificationBadge({
  count,
  onClick,
}: {
  count: number;
  onClick?: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="relative p-2 rounded-lg hover:bg-card transition-all"
    >
      <Bell className="w-5 h-5 text-foreground" />
      {count > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs flex items-center justify-center rounded-full font-bold"
        >
          {count > 9 ? '9+' : count}
        </motion.span>
      )}
    </motion.button>
  );
}
