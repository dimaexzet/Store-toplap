import Image from 'next/image'
import prisma from '@/lib/prisma'
import { LatestProducts } from '@/components/home/latest-products'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'

async function getLatestProducts() {
  const products = await prisma.product.findMany({
    take: 8,
    orderBy: {
      createdAt: 'desc',
    },
    where: {
      stock: { gt: 0 } // Only show products with stock > 0
    },
    include: {
      reviews: true,
      Image: true,
    },
  })
  
  // Convert Decimal price to number before passing to client component
  return products.map(product => ({
    ...product,
    price: Number(product.price)
  }))
}

export default async function HomePage() {
  const latestProducts = await getLatestProducts()

  const bannerItems = [
    {
      image: '/images/banner1.jpg',
      title: 'New Arrivals',
      description: 'Check out our latest collection of amazing products',
    },
    {
      image: '/images/banner2.jpg',
      title: 'Special Offers',
      description: 'Get up to 50% off on selected items',
    },
    {
      image: '/images/banner3.jpg',
      title: 'Free Shipping',
      description: 'On orders over $100',
    },
  ]

  return (
    <main className='space-y-12 my-8'>
      <section aria-labelledby="main-banner" className='container mx-auto px-4 sm:px-6 lg:px-8'>
        <h1 id="main-banner" className="text-4xl font-bold mb-8 text-center sr-only">Toplap Store - Магазин инновационной электроники</h1>
        <div className='relative'>
          <Carousel
            opts={{
              loop: true,
            }}
            className='w-full'
          >
            <CarouselContent>
              {bannerItems.map((item, index) => (
                <CarouselItem key={index}>
                  <div className='relative aspect-[21/9] w-full overflow-hidden rounded-lg'>
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className='object-cover'
                      priority={index === 0}
                    />
                    <div className='absolute inset-0 bg-black/20' />
                    <div className='absolute bottom-0 left-0 right-0 p-6 text-white bg-gradient-to-t from-black/60 to-transparent'>
                      <h2 className='text-2xl font-bold mb-2'>{item.title}</h2>
                      <p className='text-sm text-gray-200'>
                        {item.description}
                      </p>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className='left-4 md:left-8 bg-white/80 hover:bg-white/90' />
            <CarouselNext className='right-4 md:right-8 bg-white/80 hover:bg-white/90' />
          </Carousel>
        </div>
      </section>

      <section aria-labelledby="latest-products" className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 id="latest-products" className="text-3xl font-bold mb-6">Новинки в нашем магазине</h2>
        <LatestProducts products={latestProducts} />
      </section>

      <section aria-labelledby="about-us" className="container mx-auto px-4 sm:px-6 lg:px-8 bg-gray-50 py-10 rounded-lg">
        <h2 id="about-us" className="text-3xl font-bold mb-6">О магазине Toplap Store</h2>
        <div className="prose max-w-none">
          <p className="text-lg">
            Toplap Store — ваш надежный партнер в мире инновационной электроники. Мы предлагаем широкий ассортимент 
            высококачественных гаджетов, ноутбуков, смартфонов и аксессуаров от ведущих мировых производителей.
          </p>
          <p className="mt-4">
            Наши преимущества:
          </p>
          <ul className="mt-2 space-y-2">
            <li>Гарантия качества на все товары</li>
            <li>Быстрая доставка по всей стране</li>
            <li>Профессиональная консультация специалистов</li>
            <li>Выгодные акции и специальные предложения</li>
          </ul>
        </div>
      </section>
    </main>
  )
}
