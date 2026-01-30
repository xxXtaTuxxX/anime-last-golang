import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import { Search, Play, Plus, Share2, Star } from "lucide-react";
import api from "@/lib/api";
import CrunchyrollSkeleton from "@/components/skeleton/CrunchyrollSkeleton";
import AnimeHoverCard from "@/components/AnimeHoverCard";

// Helper for image URLs
const BASE_URL = '';
const getImageUrl = (path: string | null) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${BASE_URL}${cleanPath}`;
};

// Hero Skeleton replaced by CrunchyrollSkeleton full-screen variant

export default function AnimeDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { i18n } = useTranslation();
    const lang = i18n.language; // 'ar' or 'en'

    // State
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoadingDelay, setIsLoadingDelay] = useState(true);

    // Hover state management for episodes
    const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnter = (index: number) => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        setHoveredCardIndex(index);
    };

    const handleMouseLeave = () => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = setTimeout(() => {
            setHoveredCardIndex(null);
        }, 100);
    };

    const keepCardOpen = () => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };

    // Fetch Anime Data
    const { data: anime, isLoading: isQueryLoading, error } = useQuery({
        queryKey: ["anime", id],
        queryFn: async () => {
            const response = await api.get(`/animes/${id}`);
            return response.data;
        },
        enabled: !!id,
    });

    // Fetch Episodes separately as fallback (if not included in anime details)
    const { data: episodesData } = useQuery({
        queryKey: ["episodes", id],
        queryFn: async () => {
            // Try standard filtering patterns
            const response = await api.get(`/episodes`, { params: { anime_id: id } });
            return response.data;
        },
        enabled: !!id && !anime?.episodes, // Only fetch if not already present
    });

    // Track Anime View (once per anime)
    const trackedAnimeRef = useRef<number | null>(null);
    useEffect(() => {
        if (id && anime && trackedAnimeRef.current !== Number(id)) {
            trackedAnimeRef.current = Number(id);
            api.post('/history/track-anime', {
                anime_id: Number(id),
                image: anime.cover || anime.image || '' // Send anime image
            }).catch(err => console.error('Failed to track anime view:', err));
        }
    }, [id, anime]);

    // Simulate initial loading delay for smooth transition (matching Vue)
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoadingDelay(false);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    const isLoading = isQueryLoading || isLoadingDelay;

    // Combine episodes from anime object or separate fetch and strictly filter
    const episodesList = useMemo(() => {
        const list = anime?.episodes || episodesData || [];
        if (!id) return list;
        return list.filter((ep: any) => Number(ep.anime_id) === Number(id));
    }, [anime, episodesData, id]);

    // Derived Data
    const backgroundUrl = useMemo(() => {
        if (!anime) return null;
        return getImageUrl(anime.cover || anime.image);
    }, [anime]);

    const firstEpisodeId = useMemo(() => {
        if (episodesList && episodesList.length > 0) {
            return episodesList[0];
        }
        return null;
    }, [episodesList]);

    const filteredEpisodes = useMemo(() => {
        if (!episodesList) return [];
        if (!searchQuery) return episodesList;

        const query = searchQuery.toLowerCase();
        return episodesList.filter((ep: any) =>
            (ep.title && ep.title.toLowerCase().includes(query)) ||
            (ep.episode_number && ep.episode_number.toString().includes(query))
        );
    }, [episodesList, searchQuery]);

    // SEO
    const animeTitle = anime ? (lang === 'ar' ? (anime.title || anime.title_en) : (anime.title_en || anime.title)) : '';
    const pageTitle = animeTitle ? `${animeTitle} - AnimeLast` : 'Anime Details';

    if (error) {
        return <div className="min-h-screen flex items-center justify-center text-white">Error loading anime details.</div>;
    }

    return (
        <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white font-sans transition-colors duration-300">
            <Helmet>
                <title>{pageTitle}</title>
            </Helmet>

            {isLoading ? (
                <CrunchyrollSkeleton variant="full-screen" />
            ) : (
                <div className="animate-fade-in">
                    {/* HERO SECTION - Full Width, Full Viewport Height, No Margins */}
                    <div className="relative w-full h-screen overflow-hidden group">
                        {/* Background Image */}
                        <div className="absolute inset-0">
                            {backgroundUrl && (
                                <img
                                    src={backgroundUrl}
                                    alt="Background"
                                    className="w-full h-full object-cover"
                                />
                            )}
                            {/* Gradient Overlay */}
                            <div className={`absolute inset-0 bg-gradient-to-${lang === 'ar' ? 'r' : 'l'} from-transparent via-black/40 to-black/90`}></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
                        </div>

                        {/* Content Container */}
                        <div className={`absolute inset-0 flex items-center ${lang === 'ar' ? 'pr-8 md:pr-16 lg:pr-24 pl-8' : 'pl-8 md:pl-16 lg:pl-24 pr-8'}`}>
                            <div className={`w-full md:w-2/3 lg:w-1/2 space-y-6 ${lang === 'ar' ? 'text-right' : 'text-left'} z-10`}>

                                {/* Title */}
                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight drop-shadow-lg font-cairo">
                                    {animeTitle}
                                </h1>
                                {anime.title_en && lang === 'ar' && (
                                    <h2 className="text-xl md:text-2xl font-light text-gray-300">
                                        {anime.title_en}
                                    </h2>
                                )}
                                {anime.title && lang === 'en' && (
                                    <h2 className="text-xl md:text-2xl font-light text-gray-300">
                                        {anime.title}
                                    </h2>
                                )}

                                {/* Metadata Row */}
                                <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-300">
                                    <span className="px-2 py-0.5 bg-[#2a2a2a] text-gray-100 text-xs rounded border border-gray-600">14+</span>
                                    {anime.type && <span className="uppercase">{anime.type}</span>}
                                    <span className="hidden md:inline">•</span>
                                    {anime.status && <span>{anime.status}</span>}
                                    <span className="hidden md:inline">•</span>
                                    <div className="flex items-center gap-1 text-yellow-500">
                                        <Star className="w-4 h-4 fill-current" />
                                        <span>{anime.rating || 'N/A'}</span>
                                    </div>
                                </div>

                                {/* Description */}
                                <p className="text-gray-200 text-base md:text-lg leading-relaxed line-clamp-4 max-w-2xl drop-shadow-md">
                                    {(lang === 'ar' ? (anime.description || anime.description_en) : (anime.description_en || anime.description)) || 'No description available.'}
                                </p>

                                {/* Actions Buttons */}
                                <div className="flex items-center gap-4 pt-4">
                                    {firstEpisodeId ? (
                                        <Link
                                            to={`/watch/${anime.id}/${firstEpisodeId.episode_number}`}
                                            className="flex items-center gap-3 px-8 py-4 bg-[#f47521] hover:bg-[#ff8c42] text-black font-bold uppercase tracking-wide transition-transform hover:scale-105 skew-x-[-10deg]"
                                        >
                                            <span className="skew-x-[10deg] flex items-center gap-2">
                                                <Play className="w-5 h-5 fill-current" />
                                                {lang === 'ar' ? 'ابدأ المشاهدة S1 E1' : 'Start Watching S1 E1'}
                                            </span>
                                        </Link>
                                    ) : (
                                        <button disabled className="flex items-center gap-3 px-8 py-4 bg-gray-600 text-gray-400 font-bold uppercase tracking-wide cursor-not-allowed skew-x-[-10deg]">
                                            <span className="skew-x-[10deg] flex items-center gap-2">
                                                {lang === 'ar' ? 'قريبا' : 'Coming Soon'}
                                            </span>
                                        </button>
                                    )}

                                    <button className="p-4 border-2 border-[#f47521] text-[#f47521] hover:bg-[#f47521] hover:text-black transition-colors skew-x-[-10deg] group/btn">
                                        <div className="skew-x-[10deg]">
                                            <Plus className="w-6 h-6" />
                                        </div>
                                    </button>

                                    <button className="p-4 text-white hover:text-[#f47521] transition-colors">
                                        <Share2 className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* EPISODES SECTION */}
                    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
                        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                            <h3 className={`text-2xl font-bold text-gray-900 dark:text-white ${lang === 'ar' ? 'border-r-4 pr-4' : 'border-l-4 pl-4'} border-[#f47521]`}>
                                {lang === 'ar' ? 'الحلقات' : 'Episodes'}
                                <span className={`text-gray-500 text-lg font-normal ${lang === 'ar' ? 'mr-2' : 'ml-2'}`}>({episodesList?.length || 0})</span>
                            </h3>

                            {/* Search */}
                            <div className="relative w-full md:w-72">
                                <Search className={`absolute w-4 h-4 text-gray-500 -translate-y-1/2 top-1/2 ${lang === 'ar' ? 'right-3' : 'left-3'}`} />
                                <input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    type="text"
                                    placeholder={lang === 'ar' ? "بحث عن حلقة..." : "Search episodes..."}
                                    className={`w-full py-2 bg-gray-100 dark:bg-[#1c1c1c] border border-gray-200 dark:border-gray-800 rounded text-sm text-gray-900 dark:text-white placeholder-gray-500 outline-none focus:border-[#f47521] transition-colors ${lang === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                                />
                            </div>
                        </div>

                        {/* Episodes Grid */}
                        {filteredEpisodes.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredEpisodes.map((episode: any, index: number) => (
                                    <div
                                        key={episode.id}
                                        className="group cursor-pointer relative z-0"
                                        onClick={() => navigate(`/${lang}/watch/${anime.id}/${episode.episode_number}`)}
                                        onMouseEnter={() => handleMouseEnter(index)}
                                        onMouseLeave={handleMouseLeave}
                                    >
                                        {/* Cover Container */}
                                        <div className="relative aspect-video overflow-hidden bg-gray-100 dark:bg-[#1c1c1c] mb-2 shadow-sm group-hover:shadow-md transition-shadow">
                                            <img
                                                src={getImageUrl(episode.thumbnail || episode.banner)}
                                                alt={episode.title}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                loading="lazy"
                                            />

                                            {/* Play Overlay */}
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                                                <Play className="w-12 h-12 text-[#f47521] fill-current drop-shadow-lg scale-90 group-hover:scale-100 transition-transform" />
                                            </div>

                                            {/* Episode Number Badge (Top Left) */}
                                            <div className="absolute top-2 left-2 px-2.5 py-1 text-sm font-bold bg-black/70 backdrop-blur-sm text-white z-10 border border-white/10">
                                                {lang === 'ar' ? 'حلقة' : 'EP'} {episode.episode_number}
                                            </div>

                                            {/* Duration Badge (Bottom Right) */}
                                            <div className="absolute bottom-2 right-2 px-2 py-1 text-xs font-bold bg-black/80 text-white z-10">
                                                {episode.duration ? `${episode.duration}m` : '24m'}
                                            </div>
                                        </div>

                                        {/* Metadata Below Card */}
                                        <div className="space-y-2 px-1 text-center">
                                            <h3 className="text-base font-bold text-gray-900 dark:text-white line-clamp-2 leading-tight group-hover:text-[#f47521] transition-colors">
                                                {(lang === 'ar' ? episode.title : episode.title_en) || episode.title || `Episode ${episode.episode_number}`}
                                            </h3>

                                            {/* Additional Details */}
                                            <div className="flex flex-col gap-1">
                                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 h-8">
                                                    {(lang === 'ar' ? (episode.description || episode.description_en) : (episode.description_en || episode.description)) || (lang === 'ar' ? 'لا يوجد وصف' : 'No description')}
                                                </p>

                                                <div className="flex items-center justify-center gap-3 text-xs text-gray-500 pt-1 border-t border-gray-100 dark:border-gray-800 mt-1">
                                                    <div className="flex items-center gap-1">
                                                        <span>{episode.created_at ? new Date(episode.created_at).toLocaleDateString() : 'N/A'}</span>
                                                    </div>
                                                    {episode.rating && (
                                                        <div className="flex items-center gap-1 text-yellow-500">
                                                            <Star className="w-3 h-3 fill-current" />
                                                            <span>{episode.rating}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Hover Card Component */}
                                        {hoveredCardIndex === index && (
                                            <div className="absolute inset-0 z-50">
                                                <AnimeHoverCard
                                                    data={episode}
                                                    lang={lang}
                                                    onMouseEnter={keepCardOpen}
                                                    onMouseLeave={handleMouseLeave}
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-20 text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-[#1c1c1c] mb-4">
                                    <Search className="w-8 h-8 text-gray-500 dark:text-gray-600" />
                                </div>
                                <p className="text-gray-500 dark:text-gray-400">
                                    {lang === 'ar' ? 'لا توجد حلقات مطابقة للبحث.' : 'No episodes found.'}
                                </p>
                            </div>
                        )}

                    </div>
                </div>
            )}
        </div>
    );
}
