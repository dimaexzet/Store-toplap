import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ["utfs.io"],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    }
  },
  // Правильное место для внешних пакетов сервера
  serverExternalPackages: [
    "@prisma/client", 
    "decimal.js", 
    "@prisma/client/runtime/library"
  ],
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
  // Настройки ответов API
  headers: async () => {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Transfer-Encoding',
            value: 'chunked'
          },
          {
            key: 'Content-Length',
            value: '8000000'
          }
        ]
      }
    ]
  }
};

export default nextConfig;
