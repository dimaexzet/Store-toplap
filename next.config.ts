import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ["utfs.io"],
  },
  experimental: {
    serverComponentsExternalPackages: [
      "@prisma/client", 
      "decimal.js", 
      "@prisma/client/runtime"
    ],
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
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
