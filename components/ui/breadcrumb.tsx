'use client'

import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  label: string
  href?: string
  current?: boolean
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex', className)}>
      <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
        <li>
          <Link 
            href="/" 
            className="flex items-center hover:text-foreground transition-colors"
            aria-label="Главная страница"
          >
            <Home className="h-4 w-4" />
          </Link>
        </li>
        
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            <ChevronRight className="h-4 w-4 mx-1" aria-hidden="true" />
            {item.href && !item.current ? (
              <Link 
                href={item.href}
                className="hover:text-foreground transition-colors"
                aria-current={item.current ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ) : (
              <span aria-current={item.current ? 'page' : undefined} className={item.current ? 'font-medium text-foreground' : ''}>
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
} 