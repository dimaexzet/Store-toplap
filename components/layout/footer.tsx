import Link from 'next/link'
import { Facebook, Instagram, Twitter, Youtube, Linkedin, Share2, Github } from 'lucide-react'
import Script from 'next/script'

export function Footer() {
  return (
    <footer className='bg-gray-50'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-8'>
          {/* Shop */}
          <div>
            <h3 className='font-semibold mb-4'>Shop</h3>
            <ul className='space-y-2'>
              <li>
                <Link
                  href='/search'
                  className='text-gray-600 hover:text-gray-900'
                >
                  All Products
                </Link>
              </li>
              <li>
                <Link
                  href='/categories'
                  className='text-gray-600 hover:text-gray-900'
                >
                  Categories
                </Link>
              </li>
              <li>
                <Link
                  href='/deals'
                  className='text-gray-600 hover:text-gray-900'
                >
                  Deals
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className='font-semibold mb-4'>Customer Service</h3>
            <ul className='space-y-2'>
              <li>
                <Link
                  href='/contact'
                  className='text-gray-600 hover:text-gray-900'
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href='/shipping'
                  className='text-gray-600 hover:text-gray-900'
                >
                  Shipping Information
                </Link>
              </li>
              <li>
                <Link
                  href='/returns'
                  className='text-gray-600 hover:text-gray-900'
                >
                  Returns & Exchanges
                </Link>
              </li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h3 className='font-semibold mb-4'>About</h3>
            <ul className='space-y-2'>
              <li>
                <Link
                  href='/about'
                  className='text-gray-600 hover:text-gray-900'
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href='/careers'
                  className='text-gray-600 hover:text-gray-900'
                >
                  Careers
                </Link>
              </li>
              <li>
                <Link
                  href='/privacy'
                  className='text-gray-600 hover:text-gray-900'
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className='font-semibold mb-4'>Connect With Us</h3>
            <div className='flex space-x-4 mb-6'>
              <a
                href='https://facebook.com/toplap'
                target='_blank'
                rel='noopener noreferrer'
                className='text-gray-600 hover:text-blue-600 transition-colors'
                aria-label="Follow us on Facebook"
              >
                <Facebook className='h-6 w-6' />
              </a>
              <a
                href='https://twitter.com/toplap'
                target='_blank'
                rel='noopener noreferrer'
                className='text-gray-600 hover:text-blue-400 transition-colors'
                aria-label="Follow us on Twitter"
              >
                <Twitter className='h-6 w-6' />
              </a>
              <a
                href='https://instagram.com/toplap'
                target='_blank'
                rel='noopener noreferrer'
                className='text-gray-600 hover:text-pink-600 transition-colors'
                aria-label="Follow us on Instagram"
              >
                <Instagram className='h-6 w-6' />
              </a>
              <a
                href='https://github.com/dimaexzet/Store-toplap'
                target='_blank'
                rel='noopener noreferrer'
                className='text-gray-600 hover:text-gray-900 transition-colors'
                aria-label="View our GitHub repository"
              >
                <Github className='h-6 w-6' />
              </a>
              <a
                href='https://youtube.com/toplap'
                target='_blank'
                rel='noopener noreferrer'
                className='text-gray-600 hover:text-red-600 transition-colors'
                aria-label="Subscribe to our YouTube channel"
              >
                <Youtube className='h-6 w-6' />
              </a>
            </div>
            
            {/* Share Buttons */}
            <h3 className='font-semibold mb-2'>Share This Site</h3>
            <div className="sharethis-inline-share-buttons" data-url="https://toplap.store" data-title="Toplap Store - Магазин инновационной электроники"></div>
            
            {/* ShareThis Script */}
            <Script
              src="https://platform-api.sharethis.com/js/sharethis.js#property=YOUR_PROPERTY_ID&product=inline-share-buttons"
              strategy="lazyOnload"
            />
          </div>
        </div>

        <div className='mt-8 pt-8 border-t border-gray-200'>
          <p className='text-center text-gray-500'>
            © {new Date().getFullYear()} Toplap Store. All rights reserved.
          </p>
          <div className="flex justify-center mt-4 space-x-4 text-sm text-gray-500">
            <Link href="/terms" className="hover:text-gray-900">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-gray-900">Privacy Policy</Link>
            <Link href="/sitemap.xml" className="hover:text-gray-900">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
