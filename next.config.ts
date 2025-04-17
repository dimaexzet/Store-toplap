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
    // Улучшенная поддержка внешних пакетов на сервере
    serverComponentsExternalPackages: [
      "@prisma/client", 
      "decimal.js", 
      "@prisma/client/runtime/library"
    ]
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Предотвращаем обработку этих пакетов Webpack на сервере
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
  // Отключаем строгий режим для уменьшения количества ошибок
  reactStrictMode: false,
  // Увеличиваем таймаут для медленных запросов
  staticPageGenerationTimeout: 180,
  // Увеличиваем лимит тел запросов
  api: {
    responseLimit: '8mb',
    bodyParser: {
      sizeLimit: '8mb',
    },
  },
};

export default nextConfig;
