import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, Settings, Lock, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Header } from '@/components/header/Header';
import { useState, useEffect } from 'react';
import CrunchyrollSkeleton from '@/components/skeleton/CrunchyrollSkeleton';

export function UserControlPanelLayout() {
    const { t, i18n } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const isRtl = i18n.language === 'ar';
    const lang = i18n.language || 'en';

    const sidebarItems = [
        {
            title: isRtl ? 'معلومات المستخدم' : 'User Info',
            href: `/${lang}/my/dashboard`,
            icon: User,
            end: true // Exact match for root
        },
        {
            title: isRtl ? 'تعديل الملف الشخصي' : 'Edit Profile',
            href: `/${lang}/my/dashboard/edit`,
            icon: Lock
        },
        {
            title: isRtl ? 'الإعدادات' : 'Settings',
            href: `/${lang}/my/dashboard/settings`,
            icon: Settings
        }
    ];

    const [isLoading, setIsLoading] = useState(true);

    // Simulate loading for skeleton demo
    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timer);
    }, [location.pathname]);

    if (isLoading) {
        return <CrunchyrollSkeleton variant="full-screen" />;
    }

    return (
        <div className="min-h-screen bg-white dark:bg-black flex flex-col transition-colors duration-300" dir={isRtl ? 'rtl' : 'ltr'}>
            <Header />

            <div className="container mx-auto px-4 py-8 flex-1">
                <div className="flex flex-col lg:flex-row gap-12">

                    {/* Sidebar */}
                    <aside className="w-full lg:w-64 flex-shrink-0">
                        <div className="bg-transparent sticky top-24">
                            <div className="py-4 mb-2">
                                <h2 className="font-bold text-3xl text-gray-900 dark:text-white uppercase tracking-tighter">
                                    {isRtl ? 'لوحة التحكم' : 'Control Panel'}
                                </h2>
                            </div>

                            <nav className="space-y-1">
                                {sidebarItems.map((item) => (
                                    <NavLink
                                        key={item.href}
                                        to={item.href}
                                        end={item.end}
                                        className={({ isActive }) => cn(
                                            "flex items-center px-0 py-3 text-lg font-bold transition-all duration-200",
                                            isActive
                                                ? "text-[#f47521]"
                                                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                        )}
                                    >
                                        <span>{item.title}</span>
                                    </NavLink>
                                ))}
                            </nav>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 min-w-0">
                        <div className="bg-transparent min-h-[600px]">
                            <Outlet />
                        </div>
                    </main>

                </div>
            </div>
        </div>
    );
}
