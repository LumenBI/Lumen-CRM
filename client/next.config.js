/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: [],
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
        ],
    },
    webpack: (config) => {
        // Asegurar que alias existe
        if (!config.resolve.alias) {
            config.resolve.alias = {};
        }

        // Evitar que webpack intente empaquetar dependencias nativas
        config.resolve.alias.canvas = false;
        config.resolve.alias.encoding = false;

        return config;
    },
};

module.exports = nextConfig;
