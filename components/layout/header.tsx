'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, User, LogOut, X, ShoppingBag, LogIn, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSession, signIn, signOut } from 'next-auth/react'
import { CartBadge } from '@/components/layout/cart-badge'
import { AuthModal } from '@/components/layout/auth-modal'
import { SearchAutocomplete } from '@/components/search/search-autocomplete'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function Header() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  // Sync search input with URL search parameter
  useEffect(() => {
    const search = searchParams.get('search')
    if (search) {
      setSearchQuery(search)
    }
  }, [searchParams])

  const handleSearch = (query: string) => {
    router.push(`/products?search=${encodeURIComponent(query)}`)
  }

  const openAuthModal = () => {
    setIsAuthModalOpen(true)
  }

  const closeAuthModal = () => {
    setIsAuthModalOpen(false)
  }

  return (
    <>
      <header className='border-b'>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex h-16 items-center justify-between'>
            {/* Logo */}
            <div className='flex-shrink-0'>
              <Link
                href='/'
                className='flex items-center gap-2 text-xl font-bold'
              >
                <ShoppingBag className='h-6 w-6' />
                <span>AI Amazona</span>
              </Link>
            </div>

            {/* Products Catalog Link */}
            <Link
              href='/products'
              className='ml-6 text-sm font-medium text-gray-700 hover:text-gray-900'
            >
              Products
            </Link>

            {/* Search */}
            <div className='hidden sm:block flex-1 max-w-2xl mx-8'>
              <SearchAutocomplete 
                initialValue={searchQuery}
                onSearch={handleSearch}
              />
            </div>

            {/* Navigation */}
            <nav className='flex items-center gap-4'>
              <Button variant='ghost' size='icon' asChild>
                <Link href='/products'>
                  <Search className='h-5 w-5 sm:hidden' />
                </Link>
              </Button>
              <CartBadge />
              {session ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='ghost' className='flex items-center gap-2'>
                      <User className='h-5 w-5' />
                      <span className='hidden sm:inline-block'>
                        {session.user.name}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end' className='w-60'>
                    <DropdownMenuLabel className='font-normal'>
                      <div className='flex flex-col space-y-1'>
                        <p className='text-sm font-medium leading-none'>
                          {session.user.name}
                        </p>
                        <p className='text-xs leading-none text-muted-foreground'>
                          {session.user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href='/dashboard/orders'>Orders</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href='/dashboard/profile'>Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href='/dashboard/addresses'>Addresses</Link>
                    </DropdownMenuItem>
                    {session.user.role === 'ADMIN' && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href='/admin'>Admin Dashboard</Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className='text-red-600'
                    >
                      <LogOut className='mr-2 h-4 w-4' />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant='default' onClick={openAuthModal} className='flex items-center gap-2'>
                  <User className='h-5 w-5' />
                  <span>Account</span>
                </Button>
              )}
            </nav>
          </div>
        </div>
      </header>

      <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} />
    </>
  )
}
