'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  PackageSearch, 
  User2, 
  MapPin, 
  LayoutDashboard
} from 'lucide-react'
import { useSession } from 'next-auth/react'

// These were previously at the top level, now moved to admin dashboard section
const adminDashboardRoutes = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
    color: 'text-gray-500',
  },
  {
    label: 'Orders',
    icon: PackageSearch,
    href: '/dashboard/orders',
    color: 'text-sky-500',
  },
  {
    label: 'Profile',
    icon: User2,
    href: '/dashboard/profile',
    color: 'text-violet-500',
  },
  {
    label: 'Addresses',
    icon: MapPin,
    href: '/dashboard/addresses',
    color: 'text-pink-700',
  },
]

export function DashboardNav() {
  const pathname = usePathname()
  const { data: session } = useSession()
  
  return (
    <nav className='flex flex-col space-y-6'>
      {/* Admin Dashboard section (includes former userRoutes) */}
      <div className='space-y-2'>
        <div className='px-3 text-xs font-semibold text-muted-foreground'>
          Admin Dashboard
        </div>
        {adminDashboardRoutes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              'flex items-center gap-x-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
              pathname === route.href ? 'bg-accent' : 'transparent'
            )}
          >
            <route.icon className={cn('h-5 w-5', route.color)} />
            {route.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
