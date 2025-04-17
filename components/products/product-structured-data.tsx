'use client'

import Script from 'next/script'

interface ProductStructuredDataProps {
  data: {
    productId: string
    name: string
    description: string
    images: string[]
    price: number
    stock: number
    categoryName: string
    categoryId: string
    reviewCount: number
    ratingValue: string
  }
}

export function ProductStructuredData({ data }: ProductStructuredDataProps) {
  const priceValidUntil = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
  
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": data.name,
    "description": data.description,
    "image": data.images,
    "sku": data.productId,
    "mpn": data.productId,
    "brand": {
      "@type": "Brand",
      "name": "Toplap Store"
    },
    "offers": {
      "@type": "Offer",
      "url": `https://toplap.store/products/${data.productId}`,
      "priceCurrency": "EUR",
      "price": data.price,
      "priceValidUntil": priceValidUntil,
      "availability": data.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "Toplap Store"
      }
    },
    "aggregateRating": Number(data.reviewCount) > 0 ? {
      "@type": "AggregateRating",
      "ratingValue": data.ratingValue,
      "reviewCount": data.reviewCount
    } : undefined,
    "category": data.categoryName
  }

  const breadcrumbJsonLd = {
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
        "name": data.categoryName,
        "item": `https://toplap.store/categories/${data.categoryId}`
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": data.name,
        "item": `https://toplap.store/products/${data.productId}`
      }
    ]
  }

  return (
    <>
      <Script
        id="product-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd)
        }}
      />
      
      <Script
        id="breadcrumb-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd)
        }}
      />
    </>
  )
} 