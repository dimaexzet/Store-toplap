'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'

type CategoryFormProps = {
  categoryId?: string
  initialData?: {
    name: string
  }
}

export function CategoryForm({ categoryId, initialData }: CategoryFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [name, setName] = useState(initialData?.name || '')
  
  const isEditing = !!categoryId
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Category name is required',
      })
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const url = isEditing 
        ? `/api/admin/categories/${categoryId}` 
        : '/api/admin/categories'
      
      const method = isEditing ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to save category')
      }
      
      toast({
        title: `Category ${isEditing ? 'updated' : 'created'}`,
        description: `Successfully ${isEditing ? 'updated' : 'created'} category "${name}"`,
      })
      
      router.push('/admin/categories')
      router.refresh()
    } catch (error: any) {
      console.error('Error saving category:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to save category. Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Category' : 'New Category'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Category Name*</Label>
            <Input
              id="name"
              placeholder="Enter category name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={50}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push('/admin/categories')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !name.trim()}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              isEditing ? 'Update Category' : 'Create Category'
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
} 