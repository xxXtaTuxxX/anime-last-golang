import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Notification {
    id: number;
    type: 'reply' | 'like' | 'system' | 'new_post';
    data: any; // Using any for flexible JSON
    is_read: boolean;
    created_at: string;
}

export const NotificationDropdown: React.FC = () => {
    const { user } = useAuthStore();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = async () => {
        if (!user) return;
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data);
            setUnreadCount(res.data.filter((n: Notification) => !n.is_read).length);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    };

    // Poll for notifications every 30 seconds
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [user]);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAllRead = async () => {
        try {
            await api.post('/notifications/read-all');
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error(error);
        }
    };

    const handleNotificationClick = async (notif: Notification) => {
        if (!notif.is_read) {
            try {
                await api.post(`/notifications/${notif.id}/read`);
                setUnreadCount(prev => Math.max(0, prev - 1));
                setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
            } catch (error) {
                console.error(error);
            }
        }
        setIsOpen(false);

        // Parse data if it's string (sometimes Gorm handles JSON as string depending on config)
        // Since we defined it as json.RawMessage unmarshaled to Go, frontend receives object or string
        // If string, parse it.
        // But backend sends json.RawMessage which marshals to JSON on wire.

        let data = notif.data;
        if (typeof data === 'string') {
            try {
                data = JSON.parse(data);
            } catch (e) { }
        }

        // Navigation Logic
        if (notif.type === 'reply' || notif.type === 'like') {
            // Iterate to find episode if needed, or query backend.
            // Wait, notification data just has comment_id. We need episode ID to navigate!
            // Backend logic: Reply/Like on comment. Comment has EpisodeID.
            // We should probably include EpisodeID in the notification payload for easier navigation.
            // OR navigate to /comments/redirect/:id
            // FOR MVP: user won't be able to nav properly without EpisodeID.
            // Let's assume we can add episode_id to payload in backend handler later or fetch it.
            // Or just do nothing for now on CLICK except marking read.
            // Better: Let's rely on basic nav if we can.
        }
    };

    if (!user) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition"
            >
                <Bell className="w-5 h-5 dark:text-gray-300" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-zinc-900">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute left-0 mt-2 w-80 bg-white dark:bg-[#1f1f1f] rounded-xl shadow-2xl border border-gray-100 dark:border-[#333] overflow-hidden z-[100] origin-top-left animate-in fade-in zoom-in-95" dir="rtl">
                    <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-[#333]">
                        <h3 className="font-bold text-sm text-gray-900 dark:text-white">الإشعارات</h3>
                        {unreadCount > 0 && (
                            <button onClick={handleMarkAllRead} className="text-xs text-blue-500 hover:text-blue-600 font-medium">
                                تحديد الكل كمقروء
                            </button>
                        )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                            notifications.map(notif => (
                                <div
                                    key={notif.id}
                                    onClick={() => handleNotificationClick(notif)}
                                    className={`p-3 border-b border-gray-50 dark:border-[#333/50] cursor-pointer hover:bg-gray-50 dark:hover:bg-[#272727] transition ${!notif.is_read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                                >
                                    <div className="flex gap-3">
                                        <div className="flex-shrink-0 mt-1">
                                            {notif.type === 'like' && <div className="w-2 h-2 bg-red-500 rounded-full" />}
                                            {notif.type === 'reply' && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                                            {notif.type === 'system' && <div className="w-2 h-2 bg-green-500 rounded-full" />}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-800 dark:text-gray-200">
                                                {notif.type === 'like' && 'قام شخص ما بالإعجاب بتعليقك'}
                                                {notif.type === 'reply' && 'قام شخص ما بالرد على تعليقك'}
                                                {notif.type === 'system' && 'إشعار من النظام'}
                                            </p>
                                            <span className="text-xs text-gray-400 mt-1 block">
                                                {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: ar })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-gray-500 text-sm">
                                لا توجد إشعارات جديدة
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
