import './globals.css'
import { Metadata, Viewport } from 'next'
import { Toaster } from '@/components/ui/toaster'
import { Inter } from 'next/font/google'
import { CartProvider } from '@/components/providers/cart-provider'
import Script from 'next/script'
import { auth } from '@/auth'
import { SessionProvider } from '@/components/providers/session-provider'
import React from 'react'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Toaster as SonnerToaster } from 'sonner'

// Инициализируем шрифт Inter
const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-inter' })

// Перемещаем настройки viewport в отдельный экспорт
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  title: {
    default: 'AI Amazona - Интернет-магазин электроники и гаджетов',
    template: '%s | AI Amazona'
  },
  description: 'Широкий выбор современной электроники, гаджетов, компьютеров и аксессуаров. Доставка по всей России. Официальная гарантия.',
  keywords: ['электроника', 'компьютеры', 'гаджеты', 'смартфоны', 'аксессуары', 'интернет-магазин'],
  authors: [{ name: 'AI Amazona Team' }],
  creator: 'AI Amazona Team',
  publisher: 'AI Amazona',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: 'https://toplap.store',
    title: 'AI Amazona - Интернет-магазин электроники и гаджетов',
    description: 'Широкий выбор современной электроники, гаджетов, компьютеров и аксессуаров. Доставка по всей России. Официальная гарантия.',
    siteName: 'AI Amazona',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Amazona - Интернет-магазин электроники и гаджетов',
    description: 'Широкий выбор современной электроники, гаджетов, компьютеров и аксессуаров. Доставка по всей России. Официальная гарантия.',
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  verification: {
    google: 'googleVerificationCode',
    yandex: 'yandexVerificationCode',
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
      },
    ],
  },
  manifest: '/site.webmanifest',
  alternates: {
    canonical: 'https://toplap.store',
    languages: {
      'ru-RU': 'https://toplap.store',
      'en-US': 'https://toplap.store/en',
    },
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await auth()

  return (
    <html lang='ru'>
      <head>
        <link rel="canonical" href="https://toplap.store" />
        
        {/* Structured data scripts are now moved to the next/script component with lazyOnload strategy */}
        <Script 
          id="structured-data-organization"
          type="application/ld+json"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Toplap Store",
              "url": "https://toplap.store",
              "logo": "https://toplap.store/images/logo.png",
              "description": "Интернет-магазин инновационной электроники с широким ассортиментом гаджетов и аксессуаров",
              "address": {
                "@type": "PostalAddress",
                "addressCountry": "Россия"
              },
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+7-XXX-XXX-XXXX",
                "contactType": "customer service",
                "availableLanguage": ["Russian", "English"]
              },
              "sameAs": [
                "https://facebook.com/toplap",
                "https://instagram.com/toplap",
                "https://twitter.com/toplap",
                "https://vk.com/toplap"
              ]
            })
          }}
        />
        
        <Script 
          id="structured-data-website"
          type="application/ld+json"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Toplap Store",
              "url": "https://toplap.store",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://toplap.store/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        <SessionProvider session={session}>
          <CartProvider>
            {children}
            <Analytics />
            <SpeedInsights />
            <SonnerToaster position="top-right" richColors closeButton />
          </CartProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
