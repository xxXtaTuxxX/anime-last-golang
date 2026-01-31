import { useNavigate } from 'react-router-dom';
import { Home, Sparkles, ChevronDown, Monitor, Film, PlayCircle } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuGroup
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

// Helper for image URLs
const BASE_URL = '';
const getImageUrl = (path?: string | null) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${BASE_URL}${cleanPath}`;
};

interface DesktopNavigationProps {
    latestAnime: {
        latest_tv?: any;
        latest_movie?: any;
        latest_episode?: any;
    };
}

export function DesktopNavigation({ latestAnime }: DesktopNavigationProps) {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const [isOpen, setIsOpen] = useState(false);

    // Hardcoded Nav Items similar to Vue
    const mainNavItems = [
        { title: isRtl ? 'الرئيسية' : 'Home', href: `/${i18n.language}`, icon: Home },
        { title: isRtl ? 'جديد' : 'New', href: `/${i18n.language}/animes`, icon: Sparkles }, // Added New Link
        { title: isRtl ? 'أنمي القادم' : 'Coming Soon', href: `/${i18n.language}/coming-soon`, icon: Sparkles },
        { title: isRtl ? 'قائمة مسلسلات - TV' : 'TV Series', href: `/${i18n.language}/anime`, icon: Monitor },
        { title: isRtl ? 'قائمة الأفلام - Movies' : 'Movies', href: `/${i18n.language}/movies`, icon: Film },
        { title: isRtl ? 'قائمة الحلقات - Episodes' : 'Episodes List', href: `/${i18n.language}/episodes-list`, icon: PlayCircle },
    ];

    return (
        <div className="items-center hidden h-full gap-2 ml-6 lg:flex lg:flex-1">

            <button
                onClick={() => navigate(`/${i18n.language}`)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-700 transition-all duration-200 rounded-full dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800"
            >
                <Home className="w-4 h-4" />
                <span>{isRtl ? 'الرئيسية' : 'Home'}</span>
            </button>

            <button
                onClick={() => navigate(`/${i18n.language}/animes`)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-700 transition-all duration-200 rounded-full dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800"
            >
                <Sparkles className="w-4 h-4" />
                <span>{isRtl ? 'جديد' : 'New'}</span>
            </button>

            <div
                className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold text-gray-500 bg-gray-100 rounded-full dark:bg-[#333] dark:text-gray-400 cursor-default"
            >
                <Sparkles className="w-3 h-3" />
                <span>{isRtl ? 'أنمي القادم' : 'Coming Soon'}</span>
            </div>

            <div className="relative flex items-center ml-2">
                <DropdownMenu open={isOpen} onOpenChange={setIsOpen} modal={true}>
                    <DropdownMenuTrigger asChild>
                        <button
                            className="group flex-row flex-nowrap items-center gap-2.5 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors outline-none whitespace-nowrap inline-flex"
                        >
                            <span className="flex-shrink-0">{isRtl ? 'القائمة' : 'Menu'}</span>
                            <ChevronDown className="w-4 h-4 flex-shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        align="end"
                        className="p-0 border-gray-100 dark:border-neutral-800 bg-white/95 dark:bg-[#111]/95 backdrop-blur-md rounded-none mt-2 w-96 relative z-50"
                    >
                        <div className="flex flex-col w-full max-h-[600px] overflow-y-auto custom-scrollbar min-h-[350px]">

                            <div className="p-5 mb-2 border-b border-gray-100 dark:border-neutral-800">
                                <span className="font-extrabold text-gray-900 text-xl dark:text-white">
                                    {isRtl ? 'تصفح الأقسام' : 'Browse Sections'}
                                </span>
                            </div>

                            <DropdownMenuGroup className="py-2">
                                {mainNavItems.map((item) => {
                                    if (item.href === `/${i18n.language}` || item.href === `/${i18n.language}/coming-soon`) return null;

                                    return (
                                        <DropdownMenuItem
                                            key={item.href}
                                            onClick={() => navigate(item.href)}
                                            className="mb-2 rounded-none cursor-pointer focus:bg-gray-100 dark:focus:bg-[#1a1a1a]"
                                        >
                                            <div className="flex items-center justify-end w-full px-6 py-3 gap-4 group">

                                                <div className="flex items-center gap-4 text-right flex-1 justify-end">
                                                    {/* Text Info */}
                                                    <div className="flex flex-col items-end gap-0.5">
                                                        <span className="text-sm font-bold text-gray-800 dark:text-gray-100 group-hover:text-black dark:group-hover:text-white transition-colors">
                                                            {item.title}
                                                        </span>

                                                        {/* Dynamic Detail Text */}
                                                        {item.title.includes('TV') && latestAnime.latest_tv && (
                                                            <span className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1 max-w-[150px] text-right">
                                                                {isRtl ? latestAnime.latest_tv.title : latestAnime.latest_tv.title_en || latestAnime.latest_tv.title}
                                                            </span>
                                                        )}
                                                        {item.title.includes('Movies') && latestAnime.latest_movie && (
                                                            <span className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1 max-w-[150px] text-right">
                                                                {isRtl ? latestAnime.latest_movie.title : latestAnime.latest_movie.title_en || latestAnime.latest_movie.title}
                                                            </span>
                                                        )}
                                                        {item.title.includes('Episodes') && latestAnime.latest_episode && (
                                                            <>
                                                                <span className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1 max-w-[150px] text-right">
                                                                    {latestAnime.latest_episode.series?.title}
                                                                </span>
                                                                <span className="text-[10px] font-bold text-[#f47521]">
                                                                    EP {latestAnime.latest_episode.episode_number}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>

                                                    {/* Thumbnails */}
                                                    {item.title.includes('TV') && latestAnime.latest_tv && (
                                                        <div className="relative w-16 aspect-[2/3] overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm shrink-0">
                                                            <img
                                                                src={getImageUrl(latestAnime.latest_tv.image || latestAnime.latest_tv.cover)}
                                                                className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                                                                alt=""
                                                            />
                                                        </div>
                                                    )}

                                                    {item.title.includes('Movies') && latestAnime.latest_movie && (
                                                        <div className="relative w-16 aspect-[2/3] overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm shrink-0">
                                                            <img
                                                                src={getImageUrl(latestAnime.latest_movie.image || latestAnime.latest_movie.cover)}
                                                                className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                                                                alt=""
                                                            />
                                                        </div>
                                                    )}

                                                    {item.title.includes('Episodes') && latestAnime.latest_episode && (
                                                        <div className="relative w-28 aspect-video overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm shrink-0">
                                                            <img
                                                                src={getImageUrl(latestAnime.latest_episode.thumbnail)}
                                                                className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                                                                alt=""
                                                            />
                                                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <div className="w-6 h-6 flex items-center justify-center rounded-full bg-[#f47521]/90">
                                                                    <PlayCircle className="w-3 h-3 text-white fill-white" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <item.icon className="w-5 h-5 text-gray-500 group-hover:text-indigo-500 transition-colors mr-auto" />

                                            </div>
                                        </DropdownMenuItem>
                                    );
                                })}
                            </DropdownMenuGroup>
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
