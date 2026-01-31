import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Home, Sparkles, Monitor, Film, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/stores/settings-store';
import { cn } from '@/lib/utils';
import { useState } from 'react';

// Helper for image URLs
const BASE_URL = '';
const getImageUrl = (path?: string | null) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${BASE_URL}${cleanPath}`;
};

interface MobileMenuProps {
    latestAnime: {
        latest_tv?: any;
        latest_movie?: any;
        latest_episode?: any;
    };
}

export function MobileMenu({ latestAnime }: MobileMenuProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { t, i18n } = useTranslation();
    const { appName, logoUrl } = useSettingsStore();
    const isRtl = i18n.language === 'ar';
    const [isOpen, setIsOpen] = useState(false);

    // Hardcoded Nav Items similar to Vue
    const mainNavItems = [
        { title: isRtl ? 'الرئيسية' : 'Home', href: `/${i18n.language}`, icon: Home },
        { title: isRtl ? 'أنمي القادم' : 'Coming Soon', href: `/${i18n.language}/coming-soon`, icon: Sparkles },
        { title: isRtl ? 'قائمة مسلسلات - TV' : 'TV Series', href: `/${i18n.language}/anime`, icon: Monitor },
        { title: isRtl ? 'قائمة الأفلام - Movies' : 'Movies', href: `/${i18n.language}/movies`, icon: Film },
        { title: isRtl ? 'قائمة الحلقات - Episodes' : 'Episodes List', href: `/${i18n.language}/episodes-list`, icon: PlayCircle },
    ];

    const handleNavigation = (path: string) => {
        navigate(path);
        setIsOpen(false);
    };

    return (
        <div className="lg:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="w-10 h-10 mr-2 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                        <Menu className="w-6 h-6" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] p-0 bg-white dark:bg-[#0a0a0a] border-r border-neutral-200 dark:border-neutral-800">
                    <SheetTitle className="sr-only">{isRtl ? 'قائمة التنقل' : 'Navigation Menu'}</SheetTitle>
                    <SheetHeader className="flex justify-start p-6 text-left border-b border-neutral-100 dark:border-neutral-800">
                        <div className="flex items-center gap-2">
                            {logoUrl ? (
                                <img src={logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
                            ) : (
                                <div className="h-8 w-8 bg-primary rounded-none flex items-center justify-center">
                                    <span className="text-primary-foreground font-bold text-lg">A</span>
                                </div>
                            )}
                            <span className="font-bold text-gray-900 text-lg dark:text-white">{appName || 'ANIME LAST'}</span>
                        </div>
                    </SheetHeader>

                    <div className="flex flex-col justify-between flex-1 h-full p-4 overflow-y-auto">
                        <nav className="space-y-2">
                            {mainNavItems.map((item) => (
                                <button
                                    key={item.href}
                                    onClick={() => handleNavigation(item.href)}
                                    className={cn(
                                        'flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 w-full',
                                        location.pathname === item.href
                                            ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400'
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800'
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <item.icon className="w-5 h-5" />
                                        {item.title}
                                    </div>

                                    {item.title.includes('TV') && latestAnime.latest_tv && (
                                        <img
                                            src={getImageUrl(latestAnime.latest_tv.image || latestAnime.latest_tv.cover)}
                                            alt=""
                                            className="object-cover w-8 h-8 border border-gray-200 rounded-md dark:border-gray-700"
                                        />
                                    )}

                                    {item.title.includes('Movies') && latestAnime.latest_movie && (
                                        <img
                                            src={getImageUrl(latestAnime.latest_movie.image || latestAnime.latest_movie.cover)}
                                            alt=""
                                            className="object-cover w-8 h-8 border border-gray-200 rounded-md dark:border-gray-700"
                                        />
                                    )}

                                    {item.title.includes('Episodes') && latestAnime.latest_episode && (
                                        <img
                                            src={getImageUrl(latestAnime.latest_episode.thumbnail)}
                                            alt=""
                                            className="object-cover w-8 h-8 border border-gray-200 rounded-md dark:border-gray-700"
                                        />
                                    )}
                                </button>
                            ))}
                        </nav>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
