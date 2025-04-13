import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import Image from 'next/image'
import prisma from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, Mail, MapPin, Phone, User, ShieldCheck, Edit } from 'lucide-react'
import Link from 'next/link'
import { UserOrdersTable } from '@/components/admin/users/user-orders-table'
import { UserActivity } from '@/components/admin/users/user-activity'

interface UserPageProps {
  params: Promise<{ id: string }>
}

async function getUser(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      orders: {
        include: {
          items: {
            include: {
              product: {
                include: {
                  Image: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      },
      _count: {
        select: {
          reviews: true,
          orders: true
        }
      }
    }
  })

  if (!user) {
    notFound()
  }

  // Format data and calculate metrics
  const totalSpent = user.orders.reduce(
    (sum, order) => sum + Number(order.total),
    0
  )

  const formattedOrders = user.orders.map(order => ({
    ...order,
    total: Number(order.total),
    items: order.items.map(item => ({
      ...item,
      price: Number(item.price)
    }))
  }))

  const averageOrderValue = formattedOrders.length 
    ? totalSpent / formattedOrders.length 
    : 0

  // Get the last order date if any
  const lastOrderDate = formattedOrders.length 
    ? formattedOrders[0].createdAt
    : null

  return {
    ...user,
    orders: formattedOrders,
    metrics: {
      totalSpent,
      averageOrderValue,
      lastOrderDate,
      reviewCount: user._count.reviews,
      orderCount: user._count.orders
    }
  }
}

export default async function UserPage({ params }: UserPageProps) {
  const { id } = await params
  const user = await getUser(id)

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Profile</h2>
          <p className="text-muted-foreground">
            View and manage user information
          </p>
        </div>
        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          <Button variant="outline" asChild>
            <Link href={`/admin/users/${user.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Info Card */}
        <Card className="md:col-span-1">
          <CardHeader className="relative pb-0">
            <div className="flex flex-col items-center">
              <div className="flex mb-4 h-24 w-24 items-center justify-center rounded-full bg-primary/10 ring-4 ring-primary/5 overflow-hidden">
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name || 'User'}
                    width={96}
                    height={96}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-12 w-12 text-primary/60" />
                )}
              </div>
              <CardTitle className="text-xl">{user.name || 'Anonymous User'}</CardTitle>
              <CardDescription className="flex items-center mt-1">
                <Mail className="h-3.5 w-3.5 mr-1" />
                {user.email}
              </CardDescription>
              <div className="mt-2">
                <Badge
                  variant={user.role === 'ADMIN' ? 'secondary' : 'outline'}
                  className={user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : ''}
                >
                  {user.role === 'ADMIN' ? (
                    <div className="flex items-center">
                      <ShieldCheck className="h-3 w-3 mr-1" />
                      Administrator
                    </div>
                  ) : (
                    'Customer'
                  )}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center text-sm">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                Joined {format(new Date(user.createdAt), 'MMMM d, yyyy')}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Metrics Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Customer Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{user.metrics.orderCount}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold">{formatCurrency(user.metrics.totalSpent)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Average Order</p>
                <p className="text-2xl font-bold">{formatCurrency(user.metrics.averageOrderValue)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Reviews Submitted</p>
                <p className="text-2xl font-bold">{user.metrics.reviewCount}</p>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <p className="text-sm font-medium text-muted-foreground">Last Order</p>
                <p className="text-xl">
                  {user.metrics.lastOrderDate 
                    ? format(new Date(user.metrics.lastOrderDate), 'MMMM d, yyyy')
                    : 'No orders yet'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="orders" className="w-full">
        <TabsList>
          <TabsTrigger value="orders">Order History</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="orders" className="pt-4">
          <Card>
            <CardHeader className="pb-0">
              <CardTitle>Order History</CardTitle>
              <CardDescription>
                This user has placed {user.orders.length} {user.orders.length === 1 ? 'order' : 'orders'}.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <UserOrdersTable orders={user.orders} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="activity" className="pt-4">
          <Card>
            <CardHeader className="pb-0">
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                See the user's recent interactions with the store.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <UserActivity userId={user.id} orders={user.orders} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 