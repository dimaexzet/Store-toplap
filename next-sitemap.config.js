/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://toplap.store',
  generateRobotsTxt: true,
  sitemapSize: 7000,
  changefreq: 'daily',
  priority: 0.7,
  exclude: ['/admin/*', '/api/*', '/server-sitemap.xml'],
  robotsTxtOptions: {
    additionalSitemaps: [
      'https://toplap.store/server-sitemap.xml',
    ],
    policies: [
      {
        userAgent: '*',
        allow: '/',
      },
      {
        userAgent: '*',
        disallow: ['/admin', '/api'],
      },
      // Блокировка специфических ботов
      {
        userAgent: 'AhrefsBot',
        disallow: '/',
      },
      {
        userAgent: 'SemrushBot',
        disallow: '/',
      },
    ],
  },
  // Добавляем альтернативные языковые версии (если поддерживаются)
  alternateRefs: [
    {
      href: 'https://toplap.store',
      hreflang: 'ru',
    },
    {
      href: 'https://toplap.store/en',
      hreflang: 'en',
    },
  ],
  transform: async (config, path) => {
    // Настраиваем приоритеты для разных страниц
    let priority = config.priority;
    
    if (path === '/') {
      priority = 1.0;
    } else if (path.startsWith('/products') || path.startsWith('/categories')) {
      priority = 0.9;
    } else if (path.startsWith('/product/')) {
      priority = 0.8;
    } else if (path.startsWith('/search')) {
      priority = 0.7;
    }
    
    // Настраиваем частоту изменений для разных страниц
    let changefreq = config.changefreq;
    
    if (path === '/' || path.startsWith('/products')) {
      changefreq = 'daily';
    } else if (path.startsWith('/product/')) {
      changefreq = 'weekly';
    } else if (path.startsWith('/categories')) {
      changefreq = 'weekly';
    }
    
    return {
      loc: path,
      changefreq,
      priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      alternateRefs: config.alternateRefs ?? [],
    };
  },
} 