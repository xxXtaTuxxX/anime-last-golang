import { useNavigate } from 'react-router-dom';
import { User, LogIn, UserPlus, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { UserMenuContent } from './UserMenuContent';
import { useAuthStore } from '@/stores/auth-store';

export function UserDropdown() {
    const navigate = useNavigate();
    // Assuming useAuthStore has a 'user' property. Adjust if it uses 'auth.user' structure.
    const user = useAuthStore((state) => state.user);

    const getAvatarUrl = (avatar: string | undefined) => {
        if (!avatar) return undefined;
        if (avatar.startsWith('http')) return avatar;
        // Backend stores path as "/uploads/avatars/...", just ensure it's returned as is
        return avatar.startsWith('/') ? avatar : `/${avatar}`;
    };

    if (user) {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="relative w-10 h-10 overflow-hidden transition-all rounded-full ring-2 ring-transparent hover:ring-indigo-500/20"
                    >
                        {/* User Avatar */}
                        {user.avatar ? (
                            <img
                                src={getAvatarUrl(user.avatar)}
                                alt={user.name}
                                className="object-cover w-full h-full rounded-full"
                            />
                        ) : (
                            <div className="flex items-center justify-center w-full h-full text-lg font-bold text-white bg-indigo-600">
                                <span>{user.name ? user.name.charAt(0).toUpperCase() : '?'}</span>
                            </div>
                        )}
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-96 mt-2 border-gray-100 dark:border-neutral-800 bg-white dark:bg-[#111] rounded-none p-0">
                    <UserMenuContent user={user} />
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative w-10 h-10 transition-all bg-white rounded-full shadow-sm ring-1 ring-transparent hover:ring-indigo-500/30 dark:hover:ring-indigo-400/30 dark:bg-neutral-900"
                >
                    <User className="w-5 h-5 text-black dark:text-white" />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                className="w-60 mt-2 rounded-xl border border-gray-100 dark:border-neutral-800 bg-white dark:bg-[#111] shadow-xl p-2"
            >
                {/* Login */}
                <DropdownMenuItem
                    onClick={() => navigate('/auth/login')}
                    className="cursor-pointer"
                >
                    <div className="flex items-center w-full gap-3">
                        <LogIn className="w-4 h-4 text-black dark:text-white" />
                        <span>تسجيل الدخول</span>
                    </div>
                </DropdownMenuItem>

                {/* Register */}
                <DropdownMenuItem
                    onClick={() => navigate('/auth/register')}
                    className="cursor-pointer"
                >
                    <div className="flex items-center w-full gap-3">
                        <UserPlus className="w-4 h-4 text-black dark:text-white" />
                        <span>تسجيل حساب جديد</span>
                    </div>
                </DropdownMenuItem>

                {/* Home */}
                <DropdownMenuItem
                    onClick={() => navigate('/')}
                    className="cursor-pointer"
                >
                    <div className="flex items-center w-full gap-3">
                        <Home className="w-4 h-4 text-black dark:text-white" />
                        <span>العودة إلى الصفحة الرئيسية</span>
                    </div>
                </DropdownMenuItem>

            </DropdownMenuContent>
        </DropdownMenu>
    );
}
