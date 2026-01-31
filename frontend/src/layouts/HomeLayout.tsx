import { Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { useSettingsStore } from '@/stores/settings-store';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { Header } from '@/components/header/Header';

export function HomeLayout() {
    const { user } = useAuthStore();
    const { appName, logoUrl } = useSettingsStore();
    const { i18n } = useTranslation();
    const { lang } = useParams<{ lang: string }>();
    const location = useLocation();

    const currentLang = lang || i18n.language || 'en';

    return (
        <div className="flex min-h-screen bg-background dark:bg-black flex-col" dir={currentLang === 'ar' ? 'rtl' : 'ltr'}>

            <Header />

            {/* Content */}
            <main className={`flex-1 ${location.pathname.includes('/animes/') && location.pathname.split('/').length > 3 ? 'w-full p-0' : 'container mx-auto py-8 px-4'}`}>
                <Outlet />
            </main>
        </div>
    );
};
