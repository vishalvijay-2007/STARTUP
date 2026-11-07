import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  RotateCcw,
  SlidersHorizontal,
  Search,
  Sparkles,
  Star,
  Check,
  Calendar,
  Layers,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { NotificationItem } from '../../types';

interface NotificationsPageProps {
  notifications: NotificationItem[];
  onMarkAsRead: (id: string) => Promise<void>;
  onMarkAllAsRead: () => Promise<void>;
  onRefresh: () => void;
  onNavigate: (tab: any) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onRefresh,
  onNavigate,
}) => {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const importantCount = notifications.filter((n) => n.isImportant).length;

  const countByType = (type: string) => {
    if (type === 'all') return notifications.length;
    if (type === 'unread') return unreadCount;
    if (type === 'important') return importantCount;
    return notifications.filter((n) => n.type === type).length;
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'unread' && n.isRead) return false;
    if (activeFilter === 'important' && !n.isImportant) return false;
    if (
      activeFilter !== 'all' &&
      activeFilter !== 'unread' &&
      activeFilter !== 'important' &&
      n.type !== activeFilter
    ) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q);
    }
    return true;
  });

  const filterTabs = [
    { id: 'all', label: 'All', count: countByType('all') },
    { id: 'unread', label: 'Unread', count: countByType('unread') },
    { id: 'important', label: 'Important', count: countByType('important') },
    { id: 'mentorship', label: 'Mentorship', count: countByType('mentorship') },
    { id: 'milestones', label: 'Milestones', count: countByType('milestones') },
    { id: 'resources', label: 'Resources', count: countByType('resources') },
    { id: 'system', label: 'System', count: countByType('system') },
  ];

  return (
    <div className="space-y-6">
      {/* Header matching Screenshot 12 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold tracking-widest text-[#6355F4] uppercase">
            YOUR ACTIVITY
          </span>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mt-1">
            Notifications
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Stay updated on your startup journey.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onMarkAllAsRead}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Mark all as read</span>
          </button>
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => onNavigate('settings')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Preferences</span>
          </button>
        </div>
      </div>

      {/* 3 Metric Cards matching Screenshot 12 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: All notifications */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#6355F4] flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-gray-900 leading-none">
              {notifications.length}
            </p>
            <p className="text-xs text-gray-400 font-medium mt-1">All notifications</p>
          </div>
        </div>

        {/* Card 2: Unread */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#6355F4] flex items-center justify-center shrink-0">
            <div className="w-3 h-3 rounded-full bg-[#6355F4]" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-gray-900 leading-none">{unreadCount}</p>
            <p className="text-xs text-gray-400 font-medium mt-1">Unread</p>
          </div>
        </div>

        {/* Card 3: Important */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
            <Star className="w-5 h-5 fill-amber-500" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-gray-900 leading-none">{importantCount}</p>
            <p className="text-xs text-gray-400 font-medium mt-1">Important</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs matching Screenshot 12 */}
      <div className="flex flex-wrap items-center gap-2">
        {filterTabs.map((tab) => {
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#6355F4] text-white shadow-xs'
                  : 'bg-white hover:bg-gray-50 border border-gray-200 text-gray-600'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search and Sort row matching Screenshot 12 */}
      <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-80 px-3 py-1.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-gray-700">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notifications"
            className="w-full bg-transparent border-none outline-none text-xs placeholder:text-gray-400"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-gray-500">
          <span className="font-semibold text-gray-400">Sort:</span>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="bg-transparent border border-gray-200 rounded-xl px-2.5 py-1 text-xs text-gray-700 font-semibold cursor-pointer"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
      </div>

      {/* Notifications list or Empty State matching Screenshot 12 */}
      {filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 border border-gray-100 shadow-xs flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#6355F4] flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900">You're all caught up!</h3>
          <p className="text-xs text-gray-400 max-w-xs mt-1 mb-6">
            New updates about your startup journey will appear here.
          </p>
          <button
            onClick={() => onNavigate('dashboard')}
            className="bg-[#6355F4] hover:bg-[#5244E0] text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Explore your workspace
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                !notif.isRead
                  ? 'bg-purple-50/20 border-purple-200/80 shadow-xs'
                  : 'bg-white border-gray-100'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    notif.isImportant ? 'bg-amber-50 text-amber-500' : 'bg-purple-50 text-[#6355F4]'
                  }`}
                >
                  {notif.isImportant ? <Star className="w-4 h-4 fill-amber-500" /> : <Bell className="w-4 h-4" />}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-gray-900">{notif.title}</h4>
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#6355F4] shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed max-w-2xl">{notif.message}</p>
                  <p className="text-[10px] text-gray-400 mt-2">
                    {new Date(notif.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>

              {!notif.isRead && (
                <button
                  onClick={() => onMarkAsRead(notif.id)}
                  className="text-[11px] font-semibold text-[#6355F4] hover:underline shrink-0"
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
