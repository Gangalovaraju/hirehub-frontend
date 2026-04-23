import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { notifAPI } from '../api';

const TYPE_ICON = {
  APP_STATUS:   '📋',
  NEW_JOB:      '💼',
  MESSAGE:      '💬',
  PROFILE_VIEW: '👀',
  SYSTEM:       '📣',
};

export default function NotificationBell() {
  const [open, setOpen]         = useState(false);
  const [notifs, setNotifs]     = useState([]);
  const [unread, setUnread]     = useState(0);
  const [loading, setLoading]   = useState(false);
  const panelRef                = useRef();
  const navigate                = useNavigate();

  // Fetch unread count on mount and every 30s
  const refreshCount = useCallback(() => {
    notifAPI.unreadCount()
      .then(({ data }) => setUnread(data.count))
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshCount();
    const t = setInterval(refreshCount, 30000);
    return () => clearInterval(t);
  }, [refreshCount]);

  // Load full list when panel opens
  const openPanel = async () => {
    setOpen(true);
    setLoading(true);
    try {
      const { data } = await notifAPI.list();
      setNotifs(data);
    } catch {} finally { setLoading(false); }
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const markAllRead = async () => {
    await notifAPI.markAllRead();
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
  };

  const handleClick = async (notif) => {
    if (!notif.isRead) {
      await notifAPI.markRead(notif.id);
      setNotifs((prev) => prev.map((n) => n.id === notif.id ? { ...n, isRead: true } : n));
      setUnread((u) => Math.max(0, u - 1));
    }
    if (notif.link) { navigate(notif.link); setOpen(false); }
  };

  const timeAgo = (ts) => {
    const secs = Math.floor((Date.now() - new Date(ts)) / 1000);
    if (secs < 60) return 'just now';
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
    if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
    return `${Math.floor(secs / 86400)}d ago`;
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={open ? () => setOpen(false) : openPanel}
        className="relative w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 transition">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute right-0 top-10 w-80 bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <p className="text-sm font-medium text-gray-800">Notifications</p>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && (
              <div className="flex justify-center py-8">
                <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              </div>
            )}
            {!loading && notifs.length === 0 && (
              <div className="text-center py-10">
                <p className="text-2xl mb-2">🔔</p>
                <p className="text-sm text-gray-400">No notifications yet</p>
              </div>
            )}
            {notifs.map((n) => (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition border-b border-gray-50 last:border-0
                  ${!n.isRead ? 'bg-blue-50/40' : ''}`}>
                <span className="text-lg flex-shrink-0 mt-0.5">{TYPE_ICON[n.type] || '📣'}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-tight ${!n.isRead ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                    {n.title}
                  </p>
                  {n.body && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.body}</p>}
                  <p className="text-[11px] text-gray-300 mt-1">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.isRead && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}