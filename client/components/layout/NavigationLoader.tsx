import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import NavigationSkeleton from './NavigationSkeleton';

interface NavigationLoaderProps {
    children: React.ReactNode;
}

const NavigationLoader: React.FC<NavigationLoaderProps> = ({ children }) => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [targetPath, setTargetPath] = useState('');

    useEffect(() => {
        const handleStart = (url: string) => {
            if (url.split('#')[0] !== router.asPath.split('#')[0]) {
                setTargetPath(url);
                setIsLoading(true);
            }
        };

        const handleComplete = () => {
            setIsLoading(false);
            setTargetPath('');
        };

        router.events.on('routeChangeStart', handleStart);
        router.events.on('routeChangeComplete', handleComplete);
        router.events.on('routeChangeError', handleComplete);

        return () => {
            router.events.off('routeChangeStart', handleStart);
            router.events.off('routeChangeComplete', handleComplete);
            router.events.off('routeChangeError', handleComplete);
        };
    }, [router]);

    return (
        <>
            <div className={`transition-opacity duration-300 ${isLoading ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}>
                {children}
            </div>
            {isLoading && (
                <div className="transition-opacity duration-300 opacity-100">
                    <NavigationSkeleton path={targetPath} />
                </div>
            )}
        </>
    );
};

export default NavigationLoader;
