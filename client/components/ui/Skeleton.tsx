import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'rect' | 'circle' | 'text';
    width?: string | number;
    height?: string | number;
}

const Skeleton: React.FC<SkeletonProps> = ({
    className = '',
    variant = 'rect',
    width,
    height,
}) => {
    const style: React.CSSProperties = {
        width: width,
        height: height,
    };

    const variantClasses = {
        rect: 'rounded-md',
        circle: 'rounded-full',
        text: 'rounded-sm h-4 w-full mb-2',
    };

    return (
        <div
            className={`skeleton ${variantClasses[variant]} ${className}`}
            style={style}
            aria-hidden="true"
        />
    );
};

export default Skeleton;
