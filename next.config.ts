import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ["utfs.io"],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  serverExternalPackages: [
    "@prisma/client", 
    "decimal.js", 
    "@prisma/client/runtime"
  ],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'decimal.js'];
    }
    
    // Предотвращаем ошибку с десериализацией Decimal
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'decimal.js': false,
      };
    }
    
    return config;
  },
};

export default nextConfig;
