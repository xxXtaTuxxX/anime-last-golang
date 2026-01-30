import { useEffect } from 'react';
import { useHistoryStore, HistoryItem as HistoryItemType } from '@/stores/history-store';
import { useTranslation } from 'react-i18next';
import { History, PlayCircle, MessageSquare, Reply, Heart, Trash2, ArrowRight, Clock } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import CrunchyrollSkeleton from '@/components/skeleton/CrunchyrollSkeleton';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

// Helper for image URLs
const BASE_URL = '';
const getImageUrl = (path?: string | null) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${BASE_URL}${cleanPath}`;
};

// Build episode thumbnail URL from anime_id and episode_number
const getEpisodeThumbnail = (animeId: number, episodeNumber: number, fallback?: string) => {
    // Try dynamic path first: /uploads/anime/{anime_id}/episodes/{episode_number}.jpg
    const dynamicPath = `/uploads/anime/${animeId}/episodes/${episodeNumber}.jpg`;
    // If fallback exists, use it; otherwise use dynamic path
    return fallback ? getImageUrl(fallback) : getImageUrl(dynamicPath);
};

// Get icon based on activity type
const getActionIcon = (type: string) => {
    switch (type) {
        case 'comment': return MessageSquare;
        case 'reply': return Reply;
        case 'like': return Heart;
        default: return PlayCircle;
    }
};

// Get color classes based on activity type
const getActionColor = (type: string) => {
    switch (type) {
        case 'comment': return 'text-blue-500 bg-blue-100 dark:bg-blue-900/30';
        case 'reply': return 'text-green-500 bg-green-100 dark:bg-green-900/30';
        case 'like': return 'text-red-500 bg-red-100 dark:bg-red-900/30';
        default: return 'text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30';
    }
};

// Get action label
const getActionLabel = (type: string, isRtl: boolean) => {
    switch (type) {
        case 'comment': return isRtl ? 'تعليق' : 'Comment';
        case 'reply': return isRtl ? 'رد' : 'Reply';
        case 'like': return isRtl ? 'إعجاب' : 'Like';
        default: return isRtl ? 'مشاهدة' : 'View';
    }
};

// Get contextual description
const getActionDescription = (item: HistoryItemType, isRtl: boolean) => {
    let metadata: any = {};

    // Safely parse metadata
    if (item.metadata) {
        try {
            metadata = typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata;
        } catch (e) {
            console.error('Failed to parse metadata:', e);
            metadata = {};
        }
    }

    const episodeNum = item.episode?.episode_number;
    const episodeInfo = isRtl ? `الحلقة ${episodeNum}` : `Episode ${episodeNum}`;

    switch (item.activity_type) {
        case 'comment':
            return isRtl
                ? `علّقت: "${metadata.content || '...'}"`
                : `Commented: "${metadata.content || '...'}"`;
        case 'reply':
            const repliedTo = metadata.replied_to_user || (isRtl ? 'مستخدم' : 'user');
            return isRtl
                ? `رددت على ${repliedTo}: "${metadata.content || '...'}"`
                : `Replied to ${repliedTo}: "${metadata.content || '...'}"`;
        case 'like':
            const owner = metadata.comment_owner || (isRtl ? 'مستخدم' : 'user');
            return isRtl
                ? `أعجبت بتعليق ${owner}: "${metadata.comment_content || '...'}"`
                : `Liked comment by ${owner}: "${metadata.comment_content || '...'}"`;
        case 'episode_view':
            return isRtl ? `شاهدت ${episodeInfo}` : `Watched ${episodeInfo}`;
        case 'anime_view':
            return isRtl ? 'شاهدت هذا الأنمي' : 'Viewed this anime';
        default:
            return isRtl ? 'نشاط' : 'Activity';
    }
};

export default function HistoryPage() {
    const { i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const { history, isLoading, fetchHistory, clearHistory } = useHistoryStore();

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const handleClearAll = async () => {
        if (window.confirm(isRtl ? 'هل أنت متأكد من حذف كل السجل؟' : 'Are you sure you want to clear all history?')) {
            await clearHistory();
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] py-8" dir={isRtl ? 'rtl' : 'ltr'}>
            <Helmet>
                <title>{isRtl ? 'سجل النشاط' : 'Activity History'} - AnimeLast</title>
            </Helmet>

            {isLoading ? (
                <div className="flex items-center justify-center min-h-[80vh]">
                    <CrunchyrollSkeleton variant="spinner" />
                </div>
            ) : (
                <div className="container px-4 mx-auto max-w-5xl animate-fade-in">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-12 h-12 text-indigo-600 bg-indigo-100 rounded-xl dark:bg-indigo-900/30 dark:text-indigo-400">
                                <History className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {isRtl ? 'سجل النشاط' : 'Activity History'}
                                </h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {isRtl ? 'جميع أنشطتك من مشاهدات وتعليقات وإعجابات' : 'All your views, comments and likes'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleClearAll}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 transition-colors bg-red-50 rounded-lg hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                        >
                            <Trash2 className="w-4 h-4" />
                            {isRtl ? 'مسح السجل' : 'Clear History'}
                        </button>
                    </div>

                    {/* History List */}
                    {history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-500 bg-white border border-gray-100 rounded-2xl dark:bg-neutral-900 dark:border-neutral-800">
                            <History className="w-16 h-16 mb-4 opacity-20" />
                            <p className="text-lg font-medium">{isRtl ? 'لا يوجد سجل نشاط' : 'No activity history'}</p>
                            <p className="text-sm">{isRtl ? 'ابدأ بمشاهدة الحلقات والتفاعل معها' : 'Start watching episodes and interacting'}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {history.map((item) => {
                                const Icon = getActionIcon(item.activity_type);

                                // For episode views: use episode data directly
                                let image = '';
                                let title = '';
                                let episodeNumber: number | undefined;
                                let link = '#';

                                if (item.activity_type === 'episode_view' && item.episode) {
                                    // Episode view: use image saved in History
                                    image = item.image || item.episode.thumbnail || item.episode.anime?.cover || '';

                                    const animeId = item.episode.anime_id || item.episode.anime?.id;
                                    episodeNumber = item.episode.episode_number;

                                    if (animeId && episodeNumber) {
                                        link = `/${i18n.language}/watch/${animeId}/${episodeNumber}`;
                                    }

                                    title = isRtl
                                        ? (item.episode.title || 'حلقة')
                                        : (item.episode.title_en || item.episode.title || 'Episode');
                                } else if (item.anime) {
                                    // Anime view: use image saved in History
                                    image = item.image || item.anime.cover || item.anime.image || '';
                                    title = isRtl ? item.anime.title : (item.anime.title_en || item.anime.title);
                                    link = `/${i18n.language}/animes/${item.anime_id}`;
                                } else {
                                    // Fallback
                                    title = isRtl ? 'غير معروف' : 'Unknown';
                                }

                                const timeAgo = formatDistanceToNow(new Date(item.created_at), {
                                    addSuffix: true,
                                    locale: isRtl ? ar : undefined
                                });

                                return (
                                    <Link
                                        key={item.id}
                                        to={link}
                                        className="flex gap-4 p-4 transition-all bg-white border border-gray-100 rounded-xl dark:bg-neutral-900 dark:border-neutral-800 hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-800 group"
                                    >
                                        {/* Image */}
                                        <div className="relative overflow-hidden rounded-lg shrink-0 w-36 h-24">
                                            {image ? (
                                                <img
                                                    src={getImageUrl(image)}
                                                    alt={title}
                                                    className="object-cover w-full h-full"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                                                    <Icon className="w-8 h-8 text-gray-400" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 flex items-center justify-center transition-opacity opacity-0 bg-black/40 group-hover:opacity-100">
                                                <Icon className="w-8 h-8 text-white" />
                                            </div>
                                            {/* Type Badge */}
                                            <div className={`absolute px-2 py-1 text-xs font-medium rounded top-2 ${isRtl ? 'right-2' : 'left-2'} ${getActionColor(item.activity_type)}`}>
                                                {getActionLabel(item.activity_type, isRtl)}
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="flex flex-col justify-center flex-1 min-w-0 gap-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-lg font-bold text-gray-900 dark:text-white">{title}</span>
                                                {episodeNumber && (
                                                    <span className="px-2 py-0.5 text-xs font-medium text-indigo-600 bg-indigo-100 rounded dark:bg-indigo-900/30 dark:text-indigo-400">
                                                        {isRtl ? `الحلقة ${episodeNumber}` : `Episode ${episodeNumber}`}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                                {getActionDescription(item, isRtl)}
                                            </p>
                                            <span className="text-xs text-gray-400">{timeAgo}</span>
                                        </div>

                                        {/* Arrow */}
                                        <div className="flex items-center">
                                            <ArrowRight className={`w-5 h-5 text-gray-300 transition-transform group-hover:text-indigo-500 dark:text-gray-600 ${isRtl ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
