/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: [
        '@react-pdf/renderer',
        '@react-pdf/font',
        '@react-pdf/layout',
        '@react-pdf/pdfkit',
        '@react-pdf/primitives',
        '@react-pdf/render',
        '@react-pdf/stylesheet',
        '@react-pdf/textkit',
        '@react-pdf/types',
        '@react-pdf/fns'
    ],
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
        ],
    },
    webpack: (config, { isServer }) => {
        if (isServer) {
            config.resolve.alias['@react-pdf/renderer'] = false;
        }
        return config;
    },
};

module.exports = nextConfig;
