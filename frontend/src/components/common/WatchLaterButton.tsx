import React, { useEffect, useState } from 'react';
import { useWatchLaterStore } from '@/stores/watch-later-store';
import { useAuthStore } from '@/stores/auth-store';
import { Bookmark, BookmarkCheck, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WatchLaterButtonProps {
    animeId?: number;
    episodeId?: number;
    variant?: 'default' | 'icon' | 'sidebar';
    className?: string;
    showLabel?: boolean;
}

export const WatchLaterButton: React.FC<WatchLaterButtonProps> = ({
    animeId,
    episodeId,
    variant = 'default',
    className,
    showLabel = true
}) => {
    const { isSaved, toggleItem, items, fetchItems } = useWatchLaterStore();
    const { isAuthenticated } = useAuthStore();
    const [loading, setLoading] = useState(false);

    // Ensure store is populated
    useEffect(() => {
        if (isAuthenticated && items.length === 0) {
            fetchItems();
        }
    }, [isAuthenticated, fetchItems, items.length]);

    const saved = isSaved(animeId || null, episodeId || null);

    const handleToggle = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isAuthenticated) return; // Or show login modal

        setLoading(true);
        await toggleItem(animeId || null, episodeId || null);
        setLoading(false);
    };

    if (!isAuthenticated) return null;

    if (variant === 'icon') {
        return (
            <button
                onClick={handleToggle}
                className={cn(
                    "p-2 rounded-full transition-colors",
                    saved ? "text-orange-500 bg-orange-50 dark:bg-orange-500/10" : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300",
                    className
                )}
                title={saved ? "إزالة من المشاهدة لاحقا" : "مشاهدة لاحقا"}
                disabled={loading}
            >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    saved ? <BookmarkCheck className="w-5 h-5 fill-current" /> : <Bookmark className="w-5 h-5" />
                )}
            </button>
        );
    }

    if (variant === 'sidebar') {
        return (
            <button
                onClick={handleToggle}
                className={cn(
                    "p-1.5 rounded-full transition-colors flex-shrink-0",
                    saved ? "text-orange-500" : "text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400",
                    className
                )}
                title={saved ? "إزالة من المشاهدة لاحقا" : "مشاهدة لاحقا"}
                disabled={loading}
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    saved ? <BookmarkCheck className="w-4 h-4 fill-current" /> : <Bookmark className="w-4 h-4" />
                )}
            </button>
        );
    }

    // Default button style (under player)
    return (
        <button
            onClick={handleToggle}
            className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
                saved
                    ? "bg-orange-50 text-orange-600 border border-orange-200 dark:bg-orange-900/20 dark:border-orange-900/50 dark:text-orange-500"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-[#1a1a1a] dark:text-gray-300 dark:hover:bg-[#252525]",
                className
            )}
            disabled={loading}
        >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                saved ? <BookmarkCheck className="w-5 h-5 fill-current" /> : <Bookmark className="w-5 h-5" />
            )}
            {showLabel && (
                <span>{saved ? "محفوظ في القائمة" : "مشاهدة لاحقا"}</span>
            )}
        </button>
    );
};
