/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['xrpl', 'ws', 'bufferutil', 'utf-8-validate'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Don't bundle these packages - use node's native require
      config.externals = config.externals || [];
      config.externals.push('xrpl', 'ws', 'bufferutil', 'utf-8-validate');
    }
    return config;
  },
};

export default nextConfig;
