import './CrunchyrollSkeleton.css';

interface CrunchyrollSkeletonProps {
    count?: number;
    variant?: 'grid' | 'full-screen';
}

export default function CrunchyrollSkeleton({ count = 12, variant = 'grid' }: CrunchyrollSkeletonProps) {
    if (variant === 'full-screen') {
        return <div className="shimmer-wrapper fixed top-16 inset-x-0 bottom-0 z-40 w-screen h-[calc(100vh-4rem)]"></div>;
    }

    return (
        <div className="crunchyroll-skeleton-grid">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="crunchyroll-skeleton-card">
                    <div className="shimmer-wrapper poster"></div>
                    <div className="shimmer-wrapper line"></div>
                    <div className="shimmer-wrapper line short"></div>
                </div>
            ))}
        </div>
    );
}
