import { useAuthStore } from '@/stores/auth-store';
import { Navigate, Outlet } from 'react-router-dom';

export const ProtectedRoute = () => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    if (!isAuthenticated) {
        return <Navigate to="/auth/login" replace />;
    }

    return <Outlet />;
};
