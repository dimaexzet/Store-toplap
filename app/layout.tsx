import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'
import { auth } from '@/auth'
import { SessionProvider } from '@/components/providers/session-provider'
import { CartProvider } from '@/components/providers/cart-provider'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'Toplap Store | Магазин инновационной электроники',
    template: '%s | Toplap Store'
  },
  description: 'Широкий выбор электроники, гаджетов и аксессуаров с доставкой по всему миру. Лучшие цены и отличное обслуживание.',
  keywords: ['электроника', 'гаджеты', 'ноутбуки', 'смартфоны', 'аксессуары', 'интернет-магазин', 'онлайн-покупки'],
  authors: [{ name: 'Toplap Team' }],
  creator: 'Toplap Store',
  publisher: 'Toplap Store',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-video-preview': -1,
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'Toplap Store | Магазин инновационной электроники',
    description: 'Широкий выбор электроники, гаджетов и аксессуаров с доставкой по всему миру',
    url: 'https://toplap.store',
    siteName: 'Toplap Store',
    locale: 'ru_RU',
    type: 'website',
    images: [
      {
        url: 'https://toplap.store/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Toplap Store - Магазин электроники',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Toplap Store | Магазин инновационной электроники',
    description: 'Широкий выбор электроники, гаджетов и аксессуаров с доставкой по всему миру',
    images: ['https://toplap.store/images/og-image.jpg'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.png', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
  metadataBase: new URL('https://toplap.store'),
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
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider session={session}>
          <CartProvider>
            {children}
            <Toaster />
          </CartProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
