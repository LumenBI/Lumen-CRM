import React from 'react';

interface NavigationSkeletonProps {
    path: string;
}

const NavigationSkeleton: React.FC<NavigationSkeletonProps> = () => {
    return (
        <div className="animate-pulse space-y-4 p-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
        </div>
    );
};

export default NavigationSkeleton;
