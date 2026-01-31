import React from 'react';
import Skeleton from '../ui/Skeleton';
import Container from '../ui/Container';

interface NavigationSkeletonProps {
    path?: string;
}

const HeroSkeleton = () => (
    <section className="relative min-h-[60vh] md:min-h-[500px] flex items-center bg-support-grey/50">
        <Container>
            <div className="max-w-2xl space-y-6">
                <Skeleton width="150px" height="20px" className="mb-4" />
                <Skeleton width="80%" height="60px" />
                <Skeleton width="90%" height="24px" />
                <div className="pt-8">
                    <Skeleton width="200px" height="50px" />
                </div>
            </div>
        </Container>
    </section>
);

const HomeSkeleton = () => (
    <>
        <HeroSkeleton />
        <section className="py-20 bg-white">
            <Container>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="space-y-4">
                            <Skeleton width="100%" height="250px" />
                            <Skeleton width="60%" height="24px" />
                            <Skeleton width="100%" height="16px" />
                            <Skeleton width="90%" height="16px" />
                        </div>
                    ))}
                </div>
            </Container>
        </section>
    </>
);

const StandardSkeleton = () => (
    <>
        <HeroSkeleton />
        <section className="py-20 bg-white">
            <Container>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                    <div className="col-span-12 md:col-span-6">
                        <Skeleton width="100%" height="400px" />
                    </div>
                    <div className="col-span-12 md:col-span-6 space-y-6">
                        <Skeleton width="150px" height="20px" />
                        <Skeleton width="80%" height="40px" />
                        <div className="space-y-4">
                            <Skeleton width="100%" height="16px" />
                            <Skeleton width="100%" height="16px" />
                            <Skeleton width="100%" height="16px" />
                            <Skeleton width="70%" height="16px" />
                        </div>
                        <div className="pt-6 space-y-4">
                            <Skeleton width="150px" height="20px" />
                            <Skeleton width="100%" height="16px" />
                            <Skeleton width="100%" height="16px" />
                        </div>
                    </div>
                </div>
            </Container>
        </section>
    </>
);

const FormSkeleton = () => (
    <section className="pt-32 pb-20 bg-support-grey">
        <Container className="max-w-4xl">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="bg-blue-900 p-12">
                    <Skeleton width="200px" height="20px" className="bg-blue-300/30" />
                    <Skeleton width="60%" height="48px" className="mt-4 bg-white/20" />
                </div>
                <div className="p-12 space-y-10">
                    <div className="flex justify-between border-b pb-8">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="flex flex-col items-center gap-2">
                                <Skeleton variant="circle" width="40px" height="40px" />
                                <Skeleton width="60px" height="12px" />
                            </div>
                        ))}
                    </div>
                    <div className="space-y-6">
                        <Skeleton width="200px" height="24px" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="space-y-2">
                                    <Skeleton width="100px" height="14px" />
                                    <Skeleton width="100%" height="50px" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </Container>
    </section>
);

const TrackingSkeleton = () => (
    <>
        <section className="pt-32 pb-10 bg-white border-b">
            <Container>
                <div className="max-w-3xl mx-auto space-y-6 text-center">
                    <Skeleton width="200px" height="24px" className="mx-auto" />
                    <Skeleton width="100%" height="60px" />
                </div>
            </Container>
        </section>
        <section className="py-20 bg-support-grey">
            <Container>
                <div className="bg-white p-8 rounded-lg shadow-sm space-y-8">
                    <div className="flex justify-between">
                        <Skeleton width="150px" height="24px" />
                        <Skeleton width="100px" height="24px" />
                    </div>
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map(i => (
                            <Skeleton key={i} width="100%" height="60px" />
                        ))}
                    </div>
                </div>
            </Container>
        </section>
    </>
);

const BranchesSkeleton = () => (
    <>
        <HeroSkeleton />
        <section className="py-20 bg-white">
            <Container>
                <div className="space-y-20">
                    {[1, 2].map(i => (
                        <div key={i} className="space-y-8">
                            <div className="flex items-center gap-4">
                                <Skeleton variant="circle" width="48px" height="48px" />
                                <Skeleton width="250px" height="40px" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <Skeleton variant="circle" width="40px" height="40px" />
                                    <Skeleton width="80%" height="24px" />
                                    <Skeleton width="40%" height="16px" />
                                </div>
                                <div className="space-y-4">
                                    <Skeleton variant="circle" width="40px" height="40px" />
                                    <Skeleton width="80%" height="24px" />
                                    <Skeleton width="40%" height="16px" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </Container>
        </section>
    </>
);

const NavigationSkeleton: React.FC<NavigationSkeletonProps> = ({ path = '' }) => {
    const getSkeleton = () => {
        const cleanPath = path.split('#')[0].replace(/\/$/, '');

        if (cleanPath.includes('/home')) return <HomeSkeleton />;
        if (cleanPath.includes('/about-us')) return <StandardSkeleton />;
        if (cleanPath.includes('/credit-application') || cleanPath.includes('/contact')) return <FormSkeleton />;
        if (cleanPath.includes('/tracking')) return <TrackingSkeleton />;
        if (cleanPath.includes('/branches')) return <BranchesSkeleton />;

        return <HomeSkeleton />;
    };

    return (
        <div className="animate-fade-in">
            {getSkeleton()}

            <footer className="py-20 bg-[#000D42]">
                <Container>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                        <div className="space-y-6">
                            <Skeleton width="150px" height="30px" className="bg-white/20" />
                            <Skeleton width="100%" height="60px" className="bg-white/10" />
                        </div>
                        {[1, 2, 3].map(i => (
                            <div key={i} className="space-y-4">
                                <Skeleton width="100px" height="20px" className="bg-white/20" />
                                <Skeleton width="80%" height="14px" className="bg-white/10" />
                                <Skeleton width="90%" height="14px" className="bg-white/10" />
                                <Skeleton width="70%" height="14px" className="bg-white/10" />
                            </div>
                        ))}
                    </div>
                </Container>
            </footer>
        </div>
    );
};

export default NavigationSkeleton;
