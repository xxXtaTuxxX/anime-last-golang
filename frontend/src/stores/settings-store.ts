import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
    appName: string;
    logoUrl: string;
    setAppName: (name: string) => void;
    setLogoUrl: (url: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            appName: 'SaaS Platform',
            logoUrl: '',
            setAppName: (name) => set({ appName: name }),
            setLogoUrl: (url) => set({ logoUrl: url }),
        }),
        {
            name: 'settings-storage',
        }
    )
);
