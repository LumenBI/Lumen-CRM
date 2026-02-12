/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['@react-pdf/renderer'],
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
        ],
    },
};

export default nextConfig;
