import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import prisma from '@/lib/prisma'
import { ProductGallery } from '@/components/products/product-gallery'
import { ProductInfo } from '@/components/products/product-info'
import { ProductReviews } from '@/components/products/product-reviews'
import { ProductRelated } from '@/components/products/product-related'
import { ProductFAQ } from '@/components/products/product-faq'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import Script from 'next/script'

type tParams = Promise<{ id: string }>

interface ProductPageProps {
  params: tParams
}

async function getProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      Image: true,
      reviews: {
        include: {
          user: true,
        },
      },
    },
  })

  if (!product) {
    notFound()
  }

  // Convert Decimal price to number and format image URLs
  return {
    ...product,
    price: Number(product.price),
    images: product.Image.map(img => img.url)
  }
}

// Generate metadata for the product page
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params
  const product = await getProduct(id)
  
  const averageRating = product.reviews.length
    ? product.reviews.reduce((acc, review) => acc + review.rating, 0) / product.reviews.length
    : 0
    
  return {
    title: `${product.name} | Toplap Store`,
    description: product.description.substring(0, 160),
    openGraph: {
      title: product.name,
      description: product.description,
      type: 'website',
      url: `https://toplap.store/products/${product.id}`,
      images: product.images.length > 0 ? [
        {
          url: product.images[0],
          width: 800,
          height: 600,
          alt: product.name,
        }
      ] : [],
    },
    alternates: {
      canonical: `https://toplap.store/products/${product.id}`,
      languages: {
        'ru': `https://toplap.store/products/${product.id}`,
        'en': `https://toplap.store/en/products/${product.id}`,
      },
    },
  }
}

// Add generateStaticParams to pre-render popular product pages at build time
export async function generateStaticParams() {
  // Get the top 20 most viewed or best-selling products to pre-render
  const popularProducts = await prisma.product.findMany({
    select: { id: true },
    where: { featured: true },
    take: 20,
  })
  
  return popularProducts.map(product => ({
    id: product.id,
  }))
}

// Set revalidation time - product pages will be regenerated at most once every 60 minutes
export const revalidate = 3600

export default async function ProductPage(props: ProductPageProps) {
  const { id } = await props.params
  const product = await getProduct(id)
  
  const averageRating = product.reviews.length
    ? product.reviews.reduce((acc, review) => acc + review.rating, 0) / product.reviews.length
    : 0
    
  const formattedRating = averageRating.toFixed(1)
  const reviewCount = product.reviews.length

  return (
    <>
      <div className='container mx-auto px-4 py-8'>
        <Breadcrumb 
          items={[
            { label: 'Товары', href: '/products' },
            { label: product.category.name, href: `/categories/${product.category.id}` },
            { label: product.name, current: true }
          ]}
          className="mb-6"
        />
      
        <div className='grid grid-cols-1 md:grid-cols-2 gap-8 mb-16'>
          {/* Product Gallery */}
          <ProductGallery images={product.images} />

          {/* Product Information */}
          <ProductInfo product={product} />
        </div>

        {/* Reviews Section */}
        <div className='mb-16'>
          <ProductReviews productId={product.id} reviews={product.reviews} />
        </div>
        
        {/* FAQ Section */}
        <div className='mb-16'>
          <ProductFAQ 
            productName={product.name}
            productId={product.id}
            customFAQs={[
              {
                question: `Какие характеристики у ${product.name}?`,
                answer: `${product.name} имеет современный дизайн и высокое качество сборки. ${product.description}`
              }
            ]}
          />
        </div>

        {/* Related Products */}
        <div>
          <ProductRelated
            categoryId={product.categoryId}
            currentProductId={product.id}
          />
        </div>
      </div>
      
      {/* Product structured data */}
      <Script
        id="product-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": product.name,
            "description": product.description,
            "image": product.images,
            "sku": product.id,
            "mpn": product.id,
            "brand": {
              "@type": "Brand",
              "name": "Toplap Store"
            },
            "offers": {
              "@type": "Offer",
              "url": `https://toplap.store/products/${product.id}`,
              "priceCurrency": "EUR",
              "price": product.price,
              "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
              "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              "seller": {
                "@type": "Organization",
                "name": "Toplap Store"
              }
            },
            "aggregateRating": product.reviews.length > 0 ? {
              "@type": "AggregateRating",
              "ratingValue": formattedRating,
              "reviewCount": reviewCount
            } : undefined,
            "category": product.category.name
          })
        }}
      />
      
      {/* BreadcrumbList structured data */}
      <Script
        id="breadcrumb-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Главная",
                "item": "https://toplap.store"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Товары",
                "item": "https://toplap.store/products"
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": product.category.name,
                "item": `https://toplap.store/categories/${product.category.id}`
              },
              {
                "@type": "ListItem",
                "position": 4,
                "name": product.name,
                "item": `https://toplap.store/products/${product.id}`
              }
            ]
          })
        }}
      />
    </>
  )
}
