import { useNavigate, Outlet, useParams, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, Languages, Moon, Sun, Settings as SettingsIcon, LayoutDashboard, Search, History } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useSettingsStore } from '@/stores/settings-store';
import { useTranslation } from 'react-i18next';
import { useTheme } from "@/components/theme-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { WatchLaterDropdown } from '@/components/header/WatchLaterDropdown';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function HomeLayout() {
    const logout = useAuthStore((state) => state.logout);
    const user = useAuthStore((state) => state.user);
    const navigate = useNavigate();
    const { appName, logoUrl } = useSettingsStore();
    const { t, i18n } = useTranslation();
    const { setTheme } = useTheme();
    const { lang } = useParams<{ lang: string }>();
    const location = useLocation();

    const currentLang = lang || i18n.language || 'en';

    const handleLogout = () => {
        logout();
        navigate(`/${currentLang}/auth/login`, { replace: true });
    };

    const toggleLanguage = () => {
        const newLang = currentLang === 'en' ? 'ar' : 'en';
        // Replace /en with /ar or vice-versa in current path
        const newPath = location.pathname.replace(`/${currentLang}`, `/${newLang}`);
        navigate(newPath);
    };

    return (
        <div className="flex min-h-screen bg-background dark:bg-black flex-col" dir={currentLang === 'ar' ? 'rtl' : 'ltr'}>
            <header className="flex h-16 items-center gap-4 border-b border-border dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 px-8 justify-between sticky top-0 z-50">

                {/* Logo and App Name */}
                {/* Logo and App Name */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/${currentLang}`)}>
                        {logoUrl ? (
                            <img src={logoUrl} alt="Logo" className="h-12 w-12 object-contain" />
                        ) : (
                            <div className="h-12 w-12 bg-primary rounded-none flex items-center justify-center">
                                <span className="text-primary-foreground font-bold text-xl">A</span>
                            </div>
                        )}
                        <span className="font-bold text-xl tracking-tight text-primary/90 hidden md:block">{appName}</span>
                    </div>

                    <nav className="flex items-center gap-2 mx-6">
                        <Button
                            variant="ghost"
                            className="font-semibold rounded-none hover:bg-black/5 dark:hover:bg-white/10"
                            onClick={() => navigate(`/${currentLang}`)}
                        >
                            {currentLang === 'ar' ? 'الرئيسية' : 'Home'}
                        </Button>

                        <Button
                            variant="ghost"
                            className="font-semibold rounded-none hover:bg-black/5 dark:hover:bg-white/10"
                            onClick={() => navigate(`/${currentLang}/animes`)}
                        >
                            {currentLang === 'ar' ? 'جديد' : 'New'}
                        </Button>

                        <Button
                            variant="ghost"
                            className="font-semibold rounded-none hover:bg-black/5 dark:hover:bg-white/10"
                            onClick={() => navigate(`/${currentLang}/history`)}
                        >
                            <History className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                            {currentLang === 'ar' ? 'السجل' : 'History'}
                        </Button>
                    </nav>
                    <Button
                        variant="ghost"
                        className="mx-4 hidden md:flex gap-2"
                        onClick={() => navigate(`/${currentLang}/dashboard`)}
                    >
                        <LayoutDashboard className="h-5 w-5" />
                        {currentLang === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
                    </Button>
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-3">
                    {/* Search Button */}
                    <button
                        onClick={() => navigate(`/${currentLang}/search`)}
                        className="p-2 text-gray-400 hover:text-gray-100 transition-colors rounded-full hover:bg-white/10"
                        title={currentLang === 'ar' ? 'البحث' : 'Search'}
                    >
                        <Search className="w-6 h-6" />
                    </button>

                    <WatchLaterDropdown />
                    <NotificationDropdown />
                    <TooltipProvider delayDuration={100}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <Sun className="h-6 w-6 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                            <Moon className="absolute h-6 w-6 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                                            <span className="sr-only">Toggle theme</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => setTheme("light")}>
                                            Light
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setTheme("dark")}>
                                            Dark
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setTheme("system")}>
                                            System
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Theme</p>
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={toggleLanguage}>
                                    <Languages className="h-5 w-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{currentLang === 'en' ? 'Arabic' : 'English'}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={user?.avatar ? `${user.avatar}` : ""} className="object-cover" />
                                    <AvatarFallback>{user?.name?.[0]}</AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{user?.name}</p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {user?.email}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => navigate(`/${currentLang}/dashboard`)}>
                                <SettingsIcon className="mr-2 h-4 w-4" />
                                Dashboard
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                                <LogOut className="mr-2 h-4 w-4 rtl:rotate-180" />
                                {t('common.logout')}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>

            {/* Content */}
            <main className={`flex-1 ${location.pathname.includes('/animes/') && location.pathname.split('/').length > 3 ? 'w-full p-0' : 'container mx-auto py-8 px-4'}`}>
                <Outlet />
            </main>
        </div>
    );
};
