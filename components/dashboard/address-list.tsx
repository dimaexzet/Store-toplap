/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Address } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { MapPin, Trash2 } from 'lucide-react'

interface AddressListProps {
  addresses: Address[]
}

export function AddressList({ addresses }: AddressListProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(id)
      const response = await fetch(`/api/addresses/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete address')
      }

      toast({
        title: 'Address deleted',
        description: 'Your shipping address has been deleted successfully.',
      })

      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(null)
    }
  }

  if (addresses.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-8 text-center'>
        <MapPin className='h-12 w-12 text-muted-foreground' />
        <h3 className='mt-4 text-lg font-semibold'>No addresses found</h3>
        <p className='text-muted-foreground'>
          Add a new shipping address to get started.
        </p>
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      {addresses.map((address) => (
        <div
          key={address.id}
          className='flex items-start justify-between rounded-lg border p-4'
        >
          <div className='space-y-1'>
            <div className='flex items-center gap-2'>
              <p className='font-medium'>{address.street}</p>
            </div>
            <p className='text-sm text-muted-foreground'>
              {address.city}, {address.state} {address.postalCode}
            </p>
            <p className='text-sm text-muted-foreground'>{address.country}</p>
          </div>
          <div className='flex space-x-2'>
            <Button
              variant='ghost'
              size='icon'
              onClick={() => handleDelete(address.id)}
              disabled={isDeleting === address.id}
            >
              <Trash2 className='h-4 w-4' />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
