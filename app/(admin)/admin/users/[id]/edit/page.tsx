'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

// Валидационная схема для формы
const userFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  role: z.enum(['USER', 'ADMIN'], {
    required_error: 'Please select a role',
  }),
})

type UserFormValues = z.infer<typeof userFormSchema>

export default function EditUserPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const userId = params.id
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<UserFormValues | null>(null)

  // Инициализация формы
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'USER',
    },
  })

  // Загрузка данных пользователя
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`/api/admin/users/${userId}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch user data')
        }
        
        const userData = await response.json()
        form.reset({
          name: userData.name || '',
          email: userData.email || '',
          role: userData.role || 'USER',
        })
        
        setUser(userData)
      } catch (error) {
        console.error('Error fetching user:', error)
        toast({
          title: "Error",
          description: "Failed to load user data",
          variant: "destructive"
        })
      }
    }
    
    fetchUser()
  }, [userId, form])

  // Обработка отправки формы
  const onSubmit = async (data: UserFormValues) => {
    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update user')
      }
      
      toast({
        title: "Success",
        description: "User updated successfully",
      })
      router.push(`/admin/users/${userId}`)
      router.refresh()
    } catch (error) {
      console.error('Error updating user:', error)
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Edit User</h2>
          <p className="text-muted-foreground">
            Edit user profile information
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/admin/users/${userId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to User
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
          <CardDescription>
            Update the user's profile details
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter user's name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter user's email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USER">Customer</SelectItem>
                        <SelectItem value="ADMIN">Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Administrators have access to the admin dashboard and all management features
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" asChild>
                <Link href={`/admin/users/${userId}`}>Cancel</Link>
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  )
} 