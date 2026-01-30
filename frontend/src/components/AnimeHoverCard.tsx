import { Star, Plus, Bookmark, PlayCircle } from "lucide-react";

import { useNavigate } from "react-router-dom";

interface AnimeHoverCardProps {
    data: any;
    lang: string;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
}

const BASE_URL = '';

const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${BASE_URL}${cleanPath}`;
};

export default function AnimeHoverCard({ data, lang, onMouseEnter, onMouseLeave }: AnimeHoverCardProps) {
    const navigate = useNavigate();

    // Data extraction to match Vue logic
    const title = lang === 'ar' ? (data.series?.title || data.title) : (data.series?.title_en || data.title_en || data.title);
    const rating = data.series?.rating || data.rating || '4.9';
    const season = data.series?.season || (data.seasons ? `${data.seasons} Seasons` : null);
    const episodeNum = data.episode_number ? `حلقة ${data.episode_number}` : null;
    const description = lang === 'ar'
        ? (data.series?.description || data.description || 'لا يوجد وصف متاح.')
        : (data.series?.description_en || data.description_en || 'No description available.');

    const banner = data.thumbnail || data.cover || data.image; // Try to get back image

    const handlePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        // Matching Vue route logic: /ar/${type}/${id}
        // Assuming we navigate to a details or watch page
        navigate(`${lang === 'ar' ? '/ar' : '/en'}/${data.episode_number ? 'episodes' : 'animes'}/${data.id}`);
    };

    return (
        <div
            className="absolute w-[105%] h-[105%] -top-[2.5%] -left-[2.5%] z-50 flex flex-col text-right overflow-hidden transition-opacity duration-200 animate-in fade-in bg-white/95 dark:bg-black shadow-xl border border-gray-200 dark:border-transparent"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
        >
            {/* Background Image Darkened - only for Dark Mode */}
            <div className="absolute inset-0 z-0 bg-black hidden dark:block">
                {banner && (
                    <img
                        src={getImageUrl(banner)}
                        alt="bg"
                        className="w-full h-full object-cover opacity-40"
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/30" />
            </div>

            {/* Content Container */}
            <div className="relative z-10 flex flex-col h-full p-3">
                {/* Header */}
                <div className="mb-2">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 leading-tight line-clamp-2 text-right dark:shadow-black dark:drop-shadow-md">
                        {title || 'عنوان غير متوفر'}
                    </h3>

                    {/* Stats Row */}
                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300 font-medium">
                        <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="text-gray-900 dark:text-white font-bold text-sm">{typeof rating === 'number' ? rating.toFixed(1) : rating}</span>
                        </div>
                        <div>
                            {season ? (
                                <span>{typeof season === 'string' ? season : season.name}</span>
                            ) : (
                                <span>{episodeNum}</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-white/20 scrollbar-track-transparent mb-2">
                    <p className="text-sm text-gray-700 dark:text-gray-100 leading-relaxed text-right font-medium dark:drop-shadow-md">
                        {description}
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="mt-auto flex items-center justify-between pt-2 border-t border-gray-200 dark:border-white/10">
                    <button className="text-[#f47521] hover:text-[#ff8c42] transition-colors p-1" title="إضافة للقائمة">
                        <Plus className="w-5 h-5" />
                    </button>
                    <button className="text-[#f47521] hover:text-[#ff8c42] transition-colors p-1" title="حفظ">
                        <Bookmark className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handlePlay}
                        className="text-[#f47521] hover:text-[#ff8c42] transition-colors p-1"
                        title="مشاهدة"
                    >
                        <PlayCircle className="w-7 h-7 fill-transparent text-[#f47521]" />
                    </button>
                </div>
            </div>
        </div>
    );
}
