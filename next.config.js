/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['mongoose', 'playwright'],
  },
  webpack: (config) => {
    config.externals = [...(config.externals || []), 'playwright'];
    return config;
  },
}

module.exports = nextConfig
