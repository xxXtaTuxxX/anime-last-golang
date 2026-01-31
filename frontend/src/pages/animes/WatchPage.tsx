import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import {
    Play, Plus, Share2, Flag, Download, MessageSquare,
    Globe, Clock, Eye, ChevronUp, ChevronLeft, Star, Filter, Library
} from "lucide-react";
import api from "@/lib/api";
import CrunchyrollSkeleton from "@/components/skeleton/CrunchyrollSkeleton";
import AnimeHoverCard from "@/components/AnimeHoverCard";
import { Button } from "@/components/ui/button";
import EpisodesModal from '@/components/EpisodesModal';
import { CommentsSection } from '@/components/comments/CommentsSection';
import { WatchLaterButton } from '@/components/common/WatchLaterButton'; // Import Button

// Helper for image URLs
const BASE_URL = '';
const getImageUrl = (path?: string | null) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${BASE_URL}${cleanPath}`;
};

// Helper for relative time display
const getRelativeTime = (dateString: string, lang: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (lang === 'ar') {
        if (diffMinutes < 60) return `منذ ${diffMinutes} دقيقة`;
        if (diffHours < 24) return `منذ ${diffHours} ساعة`;
        if (diffDays === 1) return 'منذ يوم واحد';
        if (diffDays === 2) return 'منذ يومين';
        if (diffDays < 30) return `منذ ${diffDays} يوم`;
        if (diffDays < 365) return `منذ ${Math.floor(diffDays / 30)} شهر`;
        return `منذ ${Math.floor(diffDays / 365)} سنة`;
    } else {
        if (diffMinutes < 60) return `${diffMinutes} min ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return '1 day ago';
        if (diffDays < 30) return `${diffDays} days ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
        return `${Math.floor(diffDays / 365)} years ago`;
    }
};

export default function WatchPage() {
    const { animeId, episodeNum } = useParams(); // URL params: /watch/:animeId/:episodeNum
    const navigate = useNavigate();
    const { i18n } = useTranslation();
    const lang = i18n.language;

    // State
    const [activeTab, setActiveTab] = useState<'episodes' | 'comments'>('episodes');
    const [isLoadingDelay, setIsLoadingDelay] = useState(true);
    const [selectedServer, setSelectedServer] = useState<number>(0);
    const [isEpisodesModalOpen, setIsEpisodesModalOpen] = useState(false);
    const activeEpisodeRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // Mobile Expansion State
    const [isEpisodesExpanded, setIsEpisodesExpanded] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024); // lg breakpoint is usually where sidebar moves
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Hover State
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

    // Fetch Anime Data (includes episodes)
    const { data: anime, isLoading: isQueryLoading } = useQuery({
        queryKey: ["anime", animeId],
        queryFn: async () => {
            const response = await api.get(`/animes/${animeId}`);
            return response.data;
        },
        enabled: !!animeId,
    });

    // Fetch current episode
    const { data: episodeData, isLoading: episodeLoading, error: episodeError } = useQuery({
        queryKey: ['episode', animeId, episodeNum],
        queryFn: async () => {
            const response = await api.get(`/episodes?anime_id=${animeId}&episode_number=${episodeNum}`);
            const episodes = response.data;

            console.log('📦 API Response:', episodes);
            console.log('🔍 Looking for episode_number:', Number(episodeNum));

            const foundEpisode = episodes.find((ep: any) => ep.episode_number === Number(episodeNum)) || null;

            console.log('✅ Found Episode:', foundEpisode);
            if (foundEpisode) {
                console.log('📌 Episode ID:', foundEpisode.id, 'Episode Number:', foundEpisode.episode_number);
            }

            return foundEpisode;
        },
        enabled: !!animeId && !!episodeNum,
    });

    // Track Episode View (once per anime+episode combination)
    const trackedEpisodeRef = useRef<string | null>(null);
    useEffect(() => {
        if (episodeData?.id && animeId) {
            // CRITICAL: Always use URL animeId as source of truth
            // Database may have incorrect anime_id values for episodes
            const actualAnimeId = Number(animeId);

            console.log('Episode tracking data:', {
                episodeId: episodeData.id,
                episodeNumber: episodeData.episode_number,
                episodeAnimeId: episodeData.anime_id,
                urlAnimeId: Number(animeId),
                finalAnimeId: actualAnimeId,
                episodeThumbnail: episodeData.thumbnail
            });

            const trackingKey = `${actualAnimeId}-${episodeData.id}`;
            if (trackedEpisodeRef.current !== trackingKey) {
                trackedEpisodeRef.current = trackingKey;

                console.log('🔴 Sending to backend:', {
                    episode_id: episodeData.id,
                    anime_id: actualAnimeId,
                    image: episodeData.thumbnail || episodeData.banner || ''
                });

                // Track in backend history using the ACTUAL anime_id
                api.post('/history/track-episode', {
                    episode_id: episodeData.id, // This is the REAL database ID
                    anime_id: actualAnimeId,
                    image: episodeData.thumbnail || episodeData.banner || '' // Send episode image
                }).catch(err => console.error('Failed to track episode view:', err));
            }
        }
    }, [episodeData?.id, episodeData?.anime_id, animeId]);

    // Fetch Episodes Data (Fallback if not in anime object)
    const { data: episodesData, isLoading: isEpisodesLoading } = useQuery({
        queryKey: ["episodes", animeId],
        queryFn: async () => {
            const response = await api.get(`/episodes?anime_id=${animeId}`);
            return response.data;
        },
        enabled: !!animeId,
    });

    // Fetch Global Latest Episodes (for the bottom section)
    const { data: latestEpisodesData } = useQuery({
        queryKey: ["latestEpisodes"],
        queryFn: async () => {
            const response = await api.get('/episodes/latest?limit=12');
            return response.data;
        },
    });

    // Derived Data
    const episodesList = useMemo(() => {
        return anime?.episodes || episodesData || [];
    }, [anime, episodesData]);

    const filteredEpisodes = useMemo(() => {
        if (!animeId) return [];
        return episodesList.filter((ep: any) => Number(ep.anime_id) === Number(animeId));
    }, [episodesList, animeId]);

    // Determine Current Episode
    const currentEpisode = useMemo(() => {
        if (!filteredEpisodes.length) return null;
        return filteredEpisodes.find((ep: any) => ep.episode_number == episodeNum);
    }, [filteredEpisodes, episodeNum]);

    // Fetch Comments for Badge (Requires currentEpisode)
    const { data: commentsData } = useQuery({
        queryKey: ["comments", currentEpisode?.id],
        queryFn: async () => {
            if (!currentEpisode?.id) return [];
            const response = await api.get(`/episodes/${currentEpisode.id}/comments`);
            return response.data;
        },
        enabled: !!currentEpisode?.id,
    });



    // Scroll to active episode when list loads or episode changes (List Scroll Only)
    useEffect(() => {
        // Wait for data to load
        if (isQueryLoading || isEpisodesLoading) return;

        // Add delay to ensure DOM is fully rendered and data is loaded
        const timer = setTimeout(() => {
            if (activeEpisodeRef.current && listRef.current && filteredEpisodes.length > 0) {
                const element = activeEpisodeRef.current;
                const container = listRef.current;

                // Calculate position to align the element to the top (Vue implementation)
                const top = element.offsetTop - container.offsetTop;

                container.scrollTo({
                    top: Math.max(0, top),
                    behavior: 'smooth'
                });
            }
        }, 300); // Reduced delay since we're checking loading states

        return () => clearTimeout(timer);
    }, [episodeNum, activeTab, filteredEpisodes, isQueryLoading, isEpisodesLoading]);

    // Video Source Logic with robust parsing moved to top level
    const servers = useMemo(() => {
        if (!currentEpisode) return [];

        // Priority: Use new Servers relationship from backend
        if (currentEpisode.servers && currentEpisode.servers.length > 0) {
            return currentEpisode.servers.map((s: any) => ({
                url: s.url,
                name: s.name || `Server ${s.id}`,
                language: s.language
            }));
        }

        // Fallback: Legacy video_urls parsing
        if (!currentEpisode.video_urls) return [];
        try {
            // Attempt to parse as JSON
            let parsed;
            try {
                parsed = JSON.parse(currentEpisode.video_urls);
            } catch {
                // If parse fails, treat as plain string URL if valid
                if (typeof currentEpisode.video_urls === 'string' && currentEpisode.video_urls.startsWith('http')) {
                    return [{ url: currentEpisode.video_urls, name: "Main Server" }];
                }
                return [];
            }

            if (Array.isArray(parsed)) {
                // Ensure array elements have 'url' property, otherwise map them (if they are just strings)
                return parsed.map((item: any, idx: number) => {
                    if (typeof item === 'string') return { url: item, name: `Server ${idx + 1}` };
                    // Handle various potential keys
                    const url = item.url || item.link || item.src || item.video_url;
                    const name = item.name || item.label || item.server_name || `Server ${idx + 1}`;
                    return { url, name };
                }).filter(s => s.url); // Filter out empty urls
            }
            // If JSON is object but specific format
            if (parsed.url || parsed.link) return [{ url: parsed.url || parsed.link, name: parsed.name || "Main Server" }];
        } catch (e) {
            console.error("Error parsing video urls", e);
        }
        return [];
    }, [currentEpisode]);

    // Reset selected server when episode changes
    useEffect(() => {
        setSelectedServer(0);
    }, [currentEpisode]);

    // Simulate loading delay
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoadingDelay(false);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    const isLoading = isQueryLoading || isEpisodesLoading || isLoadingDelay;

    if (isLoading) return <CrunchyrollSkeleton variant="full-screen" />;

    if (!anime || !currentEpisode) {
        return <div className="min-h-screen flex items-center justify-center text-white">Episode not found.</div>;
    }

    const videoUrl = servers[selectedServer]?.url || "";


    return (
        <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white font-sans transition-colors duration-300">
            <Helmet>
                <title>{currentEpisode.title || `Episode ${currentEpisode.episode_number}`} - AnimeLast</title>
            </Helmet>

            {/* Video Player - Outside container on mobile for edge-to-edge, inside on desktop */}
            <div className="block md:hidden w-screen aspect-video bg-black overflow-hidden relative left-1/2 right-1/2 -mx-[50vw] -mt-8">
                {videoUrl ? (
                    <iframe
                        src={videoUrl}
                        className="w-full h-full"
                        allowFullScreen
                        title="Video Player"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-gray-500">Video source unavailable</p>
                    </div>
                )}
            </div>

            <div className="max-w-[1600px] mx-auto px-0 md:px-8 py-0 md:py-8 animate-fade-in">
                <div className="grid items-start grid-cols-1 gap-0 md:gap-4 lg:grid-cols-12">

                    {/* MAIN CONTENT (Player + Details) - lg:col-span-6 */}
                    <div className="flex flex-col mt-0 lg:col-span-6 xl:col-span-6">

                        {/* Video Player - Desktop only */}
                        <div className="hidden md:block w-full aspect-video bg-black overflow-hidden rounded-lg shadow-2xl mb-4 relative group">
                            {videoUrl ? (
                                <iframe
                                    src={videoUrl}
                                    className="w-full h-full"
                                    allowFullScreen
                                    title="Video Player"
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <p className="text-gray-500">Video source unavailable</p>
                                </div>
                            )}
                        </div>

                        {/* Servers List (Below Player) */}
                        <div className="flex flex-col gap-3 mb-4 px-2 md:px-0">
                            <h3 className="flex items-center gap-2 px-1 text-sm font-bold text-gray-900 dark:text-white">
                                <Globe className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                {lang === 'ar' ? 'سيرفرات المشاهدة' : 'Servers'}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2">
                                {servers.length > 0 ? (
                                    servers.map((server: any, idx: number) => (
                                        <Button
                                            key={idx}
                                            size="sm"
                                            onClick={() => setSelectedServer(idx)}
                                            variant={selectedServer === idx ? "default" : "ghost"}
                                            className={selectedServer === idx
                                                ? "bg-white text-black border border-gray-200 shadow hover:bg-gray-50 scale-105"
                                                : "bg-[#272727] text-gray-200 hover:bg-[#333]"
                                            }
                                        >
                                            {server.name}
                                        </Button>
                                    ))
                                ) : (
                                    <div className="flex gap-2">
                                        <span className="text-xs text-red-400">
                                            {lang === 'ar' ? 'لا توجد سيرفرات متاحة' : 'No servers available'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Episode Details */}
                        <div className="mb-6 px-2 md:px-0">
                            <h1 className="text-2xl font-bold mb-2">
                                {(lang === 'ar' ? currentEpisode.title : currentEpisode.title_en) || `Episode ${currentEpisode.episode_number}`}
                            </h1>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                                <span>{anime.title}</span>
                                <span>•</span>
                                <span>{currentEpisode.duration}m</span>
                                <span>•</span>
                                <div className="flex items-center gap-1">
                                    <Eye className="w-3 h-3" />
                                    <span>{currentEpisode.views_count || 0}</span>
                                </div>
                            </div>

                            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6">
                                {(lang === 'ar' ? (currentEpisode.description || anime.description) : (currentEpisode.description_en || anime.description_en)) || 'No description.'}
                            </p>

                            {/* Actions */}
                            <div className="flex items-center flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-[#333]">
                                <Button variant="secondary" size="sm" className="gap-2">
                                    <Share2 className="w-4 h-4" /> Share
                                </Button>
                                <Button variant="secondary" size="sm" className="gap-2">
                                    <Download className="w-4 h-4" /> Download
                                </Button>
                                <Button variant="ghost" size="sm" className="gap-2 text-red-500 hover:text-red-600 hover:bg-red-500/10 ml-auto">
                                    <Flag className="w-4 h-4" /> Report
                                </Button>
                            </div>

                            <div className="flex items-center gap-4 mt-6 mb-4">
                                <WatchLaterButton
                                    animeId={Number(animeId)}
                                    episodeId={Number(currentEpisode.id)}
                                />
                            </div>

                            {/* Social Media Share */}
                            <div className="flex items-center gap-2 pt-3 mt-3 border-t border-gray-200 dark:border-[#333]">
                                <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">
                                    {lang === 'ar' ? 'مشاركة:' : 'Share:'}
                                </span>
                                {/* Facebook */}
                                <button
                                    onClick={() => {
                                        const url = window.location.href;
                                        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
                                    }}
                                    className="p-2 bg-gray-100 dark:bg-[#1a1a1a] hover:bg-[#1877F2] dark:hover:bg-[#1877F2] text-gray-700 dark:text-gray-300 hover:text-white transition-colors"
                                    title="Share on Facebook"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                    </svg>
                                </button>
                                {/* WhatsApp */}
                                <button
                                    onClick={() => {
                                        const url = window.location.href;
                                        const text = `${currentEpisode.title || `Episode ${episodeNum}`} - ${anime.title}`;
                                        window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
                                    }}
                                    className="p-2 bg-gray-100 dark:bg-[#1a1a1a] hover:bg-[#25D366] dark:hover:bg-[#25D366] text-gray-700 dark:text-gray-300 hover:text-white transition-colors"
                                    title="Share on WhatsApp"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                    </svg>
                                </button>
                                {/* X (Twitter) */}
                                <button
                                    onClick={() => {
                                        const url = window.location.href;
                                        const text = `${currentEpisode.title || `Episode ${episodeNum}`} - ${anime.title}`;
                                        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
                                    }}
                                    className="p-2 bg-gray-100 dark:bg-[#1a1a1a] hover:bg-black dark:hover:bg-black text-gray-700 dark:text-gray-300 hover:text-white transition-colors"
                                    title="Share on X"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                    </svg>
                                </button>
                                {/* Instagram */}
                                <button
                                    onClick={() => {
                                        window.open('https://www.instagram.com/', '_blank');
                                    }}
                                    className="p-2 bg-gray-100 dark:bg-[#1a1a1a] hover:bg-gradient-to-br hover:from-[#f58529] hover:via-[#dd2a7b] hover:to-[#8134af] text-gray-700 dark:text-gray-300 hover:text-white transition-colors"
                                    title="Share on Instagram"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                    </svg>
                                </button>
                                {/* TikTok */}
                                <button
                                    onClick={() => {
                                        window.open('https://www.tiktok.com/', '_blank');
                                    }}
                                    className="p-2 bg-gray-100 dark:bg-[#1a1a1a] hover:bg-black dark:hover:bg-black text-gray-700 dark:text-gray-300 hover:text-white transition-colors"
                                    title="Share on TikTok"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                                    </svg>
                                </button>
                                {/* Bluesky */}
                                <button
                                    onClick={() => {
                                        const url = window.location.href;
                                        const text = `${currentEpisode.title || `Episode ${episodeNum}`} - ${anime.title}`;
                                        window.open(`https://bsky.app/intent/compose?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
                                    }}
                                    className="p-2 bg-gray-100 dark:bg-[#1a1a1a] hover:bg-[#0085ff] dark:hover:bg-[#0085ff] text-gray-700 dark:text-gray-300 hover:text-white transition-colors"
                                    title="Share on Bluesky"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8Z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>


                    {/* SIDEBAR (Episodes List) - lg:col-span-6 */}
                    {/* SIDEBAR (Episodes List) - lg:col-span-6 */}
                    <div className="flex mt-1 flex-col gap-4 lg:col-span-6 xl:col-span-6 h-fit">
                        {/* Sticky Header Container (Mobile Only) */}
                        <div className="sticky top-[60px] z-30 bg-white dark:bg-black md:static shadow-md md:shadow-none">
                            {/* Tabs */}
                            <div className="flex items-center bg-gray-100 dark:bg-black p-1 border-gray-200 dark:border-[#333]">
                                <button
                                    onClick={() => setActiveTab('episodes')}
                                    className={`flex-1 py-2 text-sm font-bold transition-all ${activeTab === 'episodes' ? 'bg-[#f47521] text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                                >
                                    {lang === 'ar' ? 'حلقات المسلسل' : 'Episodes'}
                                </button>
                                <button
                                    onClick={() => setActiveTab('comments')}
                                    className={`flex-1 py-2 text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'comments' ? 'bg-[#f47521] text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                                >
                                    {lang === 'ar' ? 'التعليقات' : 'Comments'}
                                    {commentsData && commentsData.length > 0 && (
                                        <span className="flex items-center justify-center min-w-[20px] h-5 px-1 text-[10px] font-bold text-white bg-red-600 rounded-full">
                                            {commentsData.length}
                                        </span>
                                    )}
                                </button>
                            </div>

                            {/* Filter Button */}
                            {activeTab === 'episodes' && (
                                <div className="flex items-center justify-end px-2 py-2 bg-white dark:bg-black border-b border-gray-100 dark:border-[#222]">
                                    <button
                                        onClick={() => setIsEpisodesModalOpen(true)}
                                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#111] border border-gray-200 dark:border-[#222] hover:bg-gray-200 dark:hover:bg-[#1a1a1a] transition-colors"
                                        title={lang === 'ar' ? 'بحث وفلترة الحلقات' : 'Search and filter episodes'}
                                    >
                                        <Filter className="w-5 h-5" />
                                        <span>{lang === 'ar' ? 'بحث' : 'Filter'}</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Episodes List Content */}
                        {activeTab === 'episodes' && (
                            <div className="flex flex-col">
                                <div ref={listRef} className={`flex flex-col gap-2 overflow-y-auto pr-0 md:pr-2 custom-scrollbar relative ${isMobile && !isEpisodesExpanded ? 'max-h-none' : 'h-[700px]'}`}>
                                    {/* Render Logic: Slicing for mobile */}
                                    {(isMobile && !isEpisodesExpanded ? filteredEpisodes.slice(0, 1) : filteredEpisodes).map((ep: any) => (
                                        <div
                                            key={ep.id}
                                            ref={Number(ep.episode_number) === Number(episodeNum) ? activeEpisodeRef : null}
                                            onClick={() => navigate(`/${lang}/watch/${anime.id}/${ep.episode_number}`)}
                                            className={`flex items-start gap-2 md:gap-3 p-1 md:p-2 cursor-pointer transition-colors border-b ${Number(ep.episode_number) === Number(episodeNum)
                                                ? 'bg-[#f47521]/10 border-[#f47521] dark:bg-[#f47521]/20'
                                                : 'bg-white dark:bg-[#111] border-gray-200 dark:border-[#222] hover:bg-gray-50 dark:hover:bg-[#1a1a1a]'
                                                }`}
                                        >
                                            {/* Thumbnail */}
                                            <div className="relative w-48 aspect-video flex-shrink-0 overflow-hidden bg-gray-900">
                                                <img
                                                    src={getImageUrl(ep.thumbnail || ep.banner)}
                                                    alt={ep.title}
                                                    className="w-full h-full object-cover"
                                                />
                                                {/* Episode Number Badge */}
                                                <div className="absolute top-1 left-1 px-1.5 py-0.5 text-[10px] font-bold bg-black/80 text-white">
                                                    EP {ep.episode_number}
                                                </div>
                                                {/* Duration Badge (New) */}
                                                <div className="absolute bottom-1 right-1 px-1 py-0.5 text-[10px] font-bold bg-black/80 text-white">
                                                    {ep.duration ? `${ep.duration}m` : '24m'}
                                                </div>
                                                {/* Play Indicator Overlay */}
                                                {Number(ep.episode_number) === Number(episodeNum) && (
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                        <Play className="w-8 h-8 text-white fill-white opacity-90" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0 flex flex-col justify-start h-full py-1">
                                                <h4 className={`text-sm font-bold mb-1 line-clamp-2 ${Number(ep.episode_number) === Number(episodeNum) ? 'text-[#f47521]' : 'text-gray-900 dark:text-white'}`}>
                                                    {(lang === 'ar' ? ep.title : ep.title_en) || `Episode ${ep.episode_number}`}
                                                </h4>

                                                {/* Episode Description */}
                                                {(ep.description || ep.description_en) && (
                                                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2 leading-relaxed">
                                                        {lang === 'ar' ? (ep.description || ep.description_en) : (ep.description_en || ep.description)}
                                                    </p>
                                                )}

                                                {/* Meta Info */}
                                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-auto">
                                                    <span>{getRelativeTime(ep.created_at || new Date().toISOString(), lang)}</span>
                                                    {ep.views_count && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="flex items-center gap-1">
                                                                <Eye className="w-3 h-3" />
                                                                {ep.views_count}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Sidebar Watch Later Button */}
                                            <div className="self-center pl-1">
                                                <WatchLaterButton
                                                    animeId={Number(animeId)}
                                                    episodeId={Number(ep.id)}
                                                    variant="sidebar"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Expand/Collapse Button for Mobile */}
                                {isMobile && filteredEpisodes.length > 1 && (
                                    <button
                                        onClick={() => setIsEpisodesExpanded(!isEpisodesExpanded)}
                                        className="w-full py-3 mt-4 flex items-center justify-center gap-3 bg-black border-2 border-white text-white font-bold text-sm tracking-wide hover:bg-gray-900 transition-colors"
                                    >
                                        {isEpisodesExpanded ? (
                                            <>
                                                <span>{lang === 'ar' ? 'أخفاء باقي الحلقات' : 'Hide remaining episodes'}</span>
                                                <ChevronUp className="w-5 h-5" />
                                            </>
                                        ) : (
                                            <>
                                                <span>{lang === 'ar' ? 'تفقد المزيد من الحلقات' : 'Check more episodes'}</span>
                                                <Library className="w-5 h-5" />
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Comments Content */}
                        {activeTab === 'comments' && (
                            <CommentsSection episodeId={Number(currentEpisode?.id)} />
                        )}
                    </div>
                </div>

                {/* Latest Episodes Section (Bottom) */}
                <div className="flex flex-col  mb-10">
                    <h3 className={`font-bold text-xl mb-4 text-gray-900 dark:text-white ${lang === 'ar' ? 'border-r-4 pr-3' : 'border-l-4 pl-3'} border-[#f47521]`}>
                        {lang === 'ar' ? 'آخر الحلقات المضافة' : 'Latest Episodes'}
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-1 md:gap-6 relative z-0 px-2 md:px-0">
                        {/* Reusing the card design from AnimeBrowsePage for consistency */}
                        {(latestEpisodesData || []).map((episode: any, index: number) => {
                            // Logic matching Vue/BrowsePage
                            const image = episode.banner || episode.image || episode.thumbnail;
                            const title = lang === 'ar' ? (episode.title || episode.series?.title) : (episode.title_en || episode.series?.title_en || episode.title);
                            const displayTitle = title || (lang === 'ar' ? 'عنوان غير متوفر' : 'Title not available');
                            const subText = episode.title || `Episode ${episode.episode_number}`;
                            const year = new Date(episode.created_at || Date.now()).getFullYear();

                            return (
                                <div
                                    key={episode.id + '_latest'}
                                    className="group cursor-pointer relative z-0"
                                    onClick={() => navigate(`/${lang}/watch/${episode.anime_id}/${episode.episode_number}`)}
                                    onMouseEnter={() => handleMouseEnter(index)}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    {/* Cover Container */}
                                    <div className="relative aspect-video overflow-hidden bg-gray-100 dark:bg-[#1c1c1c] mb-1 md:mb-2 shadow-sm group-hover:shadow-md transition-shadow">
                                        <img
                                            src={getImageUrl(image)}
                                            alt={displayTitle}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            loading="lazy"
                                        />

                                        {/* Badges */}
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
                                    <div className="space-y-1 px-0 md:px-1 text-center">
                                        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 line-clamp-2 leading-tight">
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
                            );
                        })}
                    </div>
                </div>

            </div>

            {/* Episodes Modal */}
            <EpisodesModal
                isOpen={isEpisodesModalOpen}
                onClose={() => setIsEpisodesModalOpen(false)}
                episodes={filteredEpisodes}
                activeEpisodeNum={Number(episodeNum)}
                animeId={Number(animeId)}
                lang={lang}
                isLoading={isQueryLoading || isEpisodesLoading}
                getImageUrl={getImageUrl}
                getRelativeTime={getRelativeTime}
            />
        </div>
    );
}
