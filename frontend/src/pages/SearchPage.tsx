import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Search, X, Star } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import EpisodeSkeleton from '@/components/skeleton/EpisodeSkeleton';
import CrunchyrollSkeleton from '@/components/skeleton/CrunchyrollSkeleton';
import AnimeHoverCard from '@/components/AnimeHoverCard';

// Helper for image URLs
const BASE_URL = 'http://localhost:8080';
const getImageUrl = (path?: string | null) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${BASE_URL}${cleanPath}`;
};

export default function SearchPage() {
    const { i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [hoveredEpisodeIndex, setHoveredEpisodeIndex] = useState<number | null>(null);
    const [hoveredAnimeIndex, setHoveredAnimeIndex] = useState<number | null>(null);

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Search Episodes
    const { data: episodesData, isLoading: episodesLoading } = useQuery({
        queryKey: ['search-episodes', debouncedQuery],
        queryFn: async () => {
            if (!debouncedQuery.trim()) return [];
            const response = await api.get('/episodes/search', {
                params: { search: debouncedQuery }
            });
            return response.data || [];
        },
        enabled: debouncedQuery.length > 0
    });

    // Search Animes
    const { data: animesData, isLoading: animesLoading } = useQuery({
        queryKey: ['search-animes', debouncedQuery],
        queryFn: async () => {
            if (!debouncedQuery.trim()) return [];
            const response = await api.get('/animes/search', {
                params: { search: debouncedQuery }
            });
            return response.data || [];
        },
        enabled: debouncedQuery.length > 0
    });

    const episodes = episodesData || [];
    const animes = animesData || [];

    const clearSearch = () => {
        setSearchQuery('');
        setDebouncedQuery('');
    };

    return (
        <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white transition-colors duration-300" dir={isRtl ? 'rtl' : 'ltr'}>
            <Helmet>
                <title>{isRtl ? 'البحث' : 'Search'} - AnimeLast</title>
            </Helmet>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-10">
                {/* Search Bar - Underline Style */}
                <div className="mb-12">
                    <div className="relative max-w-4xl mx-auto">
                        <div className="relative">
                            <Search className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 ${isRtl ? 'right-0' : 'left-0'}`} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={isRtl ? 'ابحث عن الأنمي أو الحلقات...' : 'Search for anime or episodes...'}
                                className={`w-full h-12 ${isRtl ? 'pr-10 pl-10' : 'pl-10 pr-10'} text-lg
                                    bg-transparent
                                    border-0 border-b-2 border-gray-300 dark:border-[#333]
                                    focus:border-orange-500 dark:focus:border-orange-500
                                    focus:outline-none
                                    text-gray-900 dark:text-white
                                    placeholder:text-gray-400
                                    transition-colors`}
                                autoFocus
                            />
                            {searchQuery && (
                                <button
                                    onClick={clearSearch}
                                    className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'left-0' : 'right-0'} 
                                        text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors`}
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Results */}
                {debouncedQuery && (
                    <div className="space-y-12">
                        {/* Episodes Section */}
                        <section className="mb-10">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-bold">
                                    {isRtl ? 'الحلقات' : 'Episodes'}
                                </h2>
                            </div>

                            {episodesLoading ? (
                                <EpisodeSkeleton count={18} />
                            ) : episodes.length > 0 ? (
                                <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-6 relative z-0">
                                    {episodes.slice(0, 18).map((episode: any, index: number) => (
                                        <EpisodeCard
                                            key={episode.id}
                                            episode={episode}
                                            index={index}
                                            lang={i18n.language}
                                            isHovered={hoveredEpisodeIndex === index}
                                            onMouseEnter={() => setHoveredEpisodeIndex(index)}
                                            onMouseLeave={() => setHoveredEpisodeIndex(null)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center py-10 text-gray-500">
                                    {isRtl ? 'لم يتم العثور على حلقات' : 'No episodes found'}
                                </p>
                            )}
                        </section>

                        {/* Animes Section */}
                        <section className="mb-10">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-bold">
                                    {isRtl ? 'المسلسلات' : 'Animes'}
                                </h2>
                            </div>

                            {animesLoading ? (
                                <CrunchyrollSkeleton count={12} variant="grid" />
                            ) : animes.length > 0 ? (
                                <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 relative z-0">
                                    {animes.map((anime: any, index: number) => (
                                        <AnimeCard
                                            key={anime.id}
                                            anime={anime}
                                            index={index}
                                            lang={i18n.language}
                                            isHovered={hoveredAnimeIndex === index}
                                            onMouseEnter={() => setHoveredAnimeIndex(index)}
                                            onMouseLeave={() => setHoveredAnimeIndex(null)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center py-10 text-gray-500">
                                    {isRtl ? 'لم يتم العثور على مسلسلات' : 'No animes found'}
                                </p>
                            )}
                        </section>
                    </div>
                )}

                {/* Empty State */}
                {!debouncedQuery && (
                    <div className="text-center py-20">
                        <Search className="w-20 h-20 mx-auto mb-4 text-gray-300 dark:text-gray-700" />
                    </div>
                )}
            </div>
        </div>
    );
}

// Episode Card Component - Matching AnimeBrowsePage 100%
const EpisodeCard = ({ episode, index, lang, isHovered, onMouseEnter, onMouseLeave }: any) => {
    const image = episode.banner || episode.image;
    const title = lang === 'ar' ? (episode.title || episode.series?.title) : (episode.title_en || episode.series?.title_en || episode.title);
    const displayTitle = title || 'عنوان غير متوفر';
    const subText = episode.title || `الحلقة ${episode.episode_number}`;
    const year = new Date(episode.created_at || Date.now()).getFullYear();
    const animeId = episode.anime_id || episode.series?.id || episode.series_id;

    return (
        <Link
            to={`/${lang}/watch/${animeId}/${episode.episode_number}`}
            className="group cursor-pointer relative z-0"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            {/* Cover Container */}
            <div className="relative aspect-video overflow-hidden bg-gray-100 dark:bg-[#1c1c1c] mb-2">
                <img
                    src={getImageUrl(image)}
                    alt={displayTitle}
                    className="w-full h-full object-cover"
                    loading="lazy"
                />

                {/* Badge */}
                <div className="absolute top-2 left-2 px-2 py-0.5 text-xs font-bold text-white z-10 bg-black/80">
                    {episode.episode_number}
                </div>

                {/* NEW Badge */}
                {index < 6 && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 text-xs font-bold bg-green-500 rounded text-white z-10">
                        {lang === 'ar' ? 'جديد' : 'NEW'}
                    </div>
                )}
            </div>

            {/* Metadata Below Card */}
            <div className="space-y-1 px-1 text-center">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 leading-tight">
                    {displayTitle}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                    {subText}
                </p>
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-500">
                    <span className="text-gray-600">•</span>
                    <span>{year}</span>
                </div>
            </div>

            {/* Hover Card */}
            {isHovered && (
                <div className="absolute inset-0 z-50">
                    <AnimeHoverCard
                        data={{
                            id: animeId,
                            title: episode.series?.title || displayTitle,
                            title_en: episode.series?.title_en,
                            cover: episode.series?.cover || episode.series?.image,
                            image: episode.series?.image,
                            description: episode.series?.description,
                            rating: episode.series?.rating,
                            type: episode.series?.type,
                            status: episode.series?.status,
                        }}
                        lang={lang}
                        onMouseEnter={onMouseEnter}
                        onMouseLeave={onMouseLeave}
                    />
                </div>
            )}
        </Link>
    );
};

// Anime Card Component - Matching AnimeBrowsePage 100%
const AnimeCard = ({ anime, index, lang, isHovered, onMouseEnter, onMouseLeave }: any) => {
    const image = anime.image || anime.cover;
    const title = lang === 'ar' ? anime.title : (anime.title_en || anime.title);
    const displayTitle = title || 'عنوان غير متوفر';
    const subText = anime.status || 'مستمر';
    const year = new Date(anime.created_at || Date.now()).getFullYear();

    return (
        <Link
            to={`/${lang}/animes/${anime.id}`}
            className="group cursor-pointer relative z-0"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            {/* Cover Container */}
            <div className="relative aspect-[2/3] overflow-hidden bg-gray-100 dark:bg-[#1c1c1c] mb-2">
                <img
                    src={getImageUrl(image)}
                    alt={displayTitle}
                    className="w-full h-full object-cover"
                    loading="lazy"
                />

                {/* Badge */}
                <div className="absolute top-2 left-2 px-2 py-0.5 text-xs font-bold text-white z-10 bg-black/80">
                    {anime.type === 'tv' ? 'مسلسل' : 'فيلم'}
                </div>

                {/* NEW Badge */}
                {index < 6 && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 text-xs font-bold bg-green-500 rounded text-white z-10">
                        {lang === 'ar' ? 'جديد' : 'NEW'}
                    </div>
                )}
            </div>

            {/* Metadata Below Card */}
            <div className="space-y-1 px-1 text-center">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 leading-tight">
                    {displayTitle}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                    {subText}
                </p>
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-500">
                    <div className="flex items-center gap-1 text-yellow-500">
                        <Star className="w-3 h-3 fill-current" />
                        <span>{anime.rating || 'N/A'}</span>
                    </div>
                    <span className="text-gray-600">•</span>
                    <span>{year}</span>
                </div>
            </div>

            {/* Hover Card */}
            {isHovered && (
                <div className="absolute inset-0 z-50">
                    <AnimeHoverCard
                        data={anime}
                        lang={lang}
                        onMouseEnter={onMouseEnter}
                        onMouseLeave={onMouseLeave}
                    />
                </div>
            )}
        </Link>
    );
};
