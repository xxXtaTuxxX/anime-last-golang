import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/stores/settings-store';
import { useAuthStore } from '@/stores/auth-store';
import api from '@/lib/api';

// Components
import { MobileMenu } from './MobileMenu';
import { DesktopNavigation } from './DesktopNavigation';
import { ThemeToggle } from './ThemeToggle';
import { WatchLaterDropdown } from './WatchLaterDropdown';
import { HistoryDropdown } from './HistoryDropdown';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { UserDropdown } from './UserDropdown';

// Define Prop Types
interface LatestAnime {
    latest_tv?: any;
    latest_movie?: any;
    latest_episode?: any;
}

export function Header() {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const { appName, logoUrl } = useSettingsStore();
    const { user } = useAuthStore();
    const isRtl = i18n.language === 'ar';

    // Latest Anime State with Cache
    const [latestAnime, setLatestAnime] = useState<LatestAnime>({});
    const CACHE_KEY = 'latest_anime_cache';
    const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

    useEffect(() => {
        const fetchLatestAnime = async () => {
            try {
                // Check Cache
                const cached = sessionStorage.getItem(CACHE_KEY);
                if (cached) {
                    const { data, timestamp } = JSON.parse(cached);
                    if (Date.now() - timestamp < CACHE_DURATION) {
                        setLatestAnime(data);
                        return;
                    }
                }

                // Fetch from API
                const res = await api.get('/latest-tv-anime'); // Adjust endpoint if needed
                setLatestAnime(res.data);

                // Update Cache
                sessionStorage.setItem(CACHE_KEY, JSON.stringify({
                    data: res.data,
                    timestamp: Date.now()
                }));
            } catch (error) {
                console.error('Failed to fetch latest anime', error);
            }
        };

        fetchLatestAnime();
    }, []);

    // Scroll Effect (Optional, currently using simple sticky)
    // You can add logic to change background opacity on scroll if needed

    return (
        <div dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="fixed top-0 left-0 z-50 w-full transition-colors duration-300 border-b bg-white dark:bg-[#312F2E] border-gray-100 dark:border-[#312F2E]">
                <div className="relative flex items-center h-[60px] px-4 mx-auto w-full max-w-[1800px]">

                    {/* Mobile Menu */}
                    <MobileMenu latestAnime={latestAnime} />

                    {/* Logo */}
                    <Link to={`/${i18n.language}`} className="flex items-center mr-4 transition-transform gap-x-2 hover:scale-105 rtl:ml-4 rtl:mr-0">
                        {logoUrl ? (
                            <img src={logoUrl} alt="Logo" className="w-auto h-9 object-contain" />
                        ) : (
                            <div className="h-9 px-2 bg-primary rounded bg-orange-500 text-white flex items-center justify-center font-bold">
                                A
                            </div>
                        )}
                        <span className="font-bold text-gray-900 dark:text-white hidden sm:block text-xl">{appName || 'ANIME LAST'}</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <DesktopNavigation latestAnime={latestAnime} />

                    {/* Right Side Actions */}
                    <div className="flex items-center gap-2 ml-auto lg:gap-3 rtl:ml-0 rtl:mr-auto">

                        {/* Search Button */}
                        <Link
                            to={`/${i18n.language}/search`}
                            className="p-2 text-gray-600 transition-colors rounded-full hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10 hover:text-[#f47521]"
                        >
                            <Search className="w-6 h-6" />
                        </Link>

                        {/* Icons Container */}
                        <div className="flex items-center gap-2 lg:gap-3">
                            <ThemeToggle />

                            {/* User Menu containing Notifications, History, etc. */}
                            <UserDropdown />
                        </div>
                    </div>

                </div>
            </div>

            {/* Spacer for fixed header */}
            <div className="pt-[60px]"></div>
        </div>
    );
}
