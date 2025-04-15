import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import prisma from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Download, Search, Plus, Filter } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UsersList } from '@/components/admin/users/users-list'
import { Role, Prisma } from '@prisma/client'
import Link from 'next/link'

// Добавить типы для пользовательских данных
interface UserWithOrders {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
  orders: {
    id: string;
    total: number;
  }[];
  _count: {
    orders: number;
  };
}

interface FormattedUser extends UserWithOrders {
  orderCount: number;
  totalSpent: number;
}

interface UsersPageProps {
  searchParams: Promise<{
    query?: string
    role?: string
    sort?: string
    page?: string
  }>
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const params = await searchParams
  const query = params.query || ''
  const role = params.role || 'ALL'
  const sort = params.sort || 'name-asc'
  const page = Number(params.page) || 1
  const pageSize = 10
  
  // Parse sorting options
  const [sortField, sortDirection] = sort.split('-')
  
  // Build filter conditions
  const where: Prisma.UserWhereInput = {
    ...(query ? {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ]
    } : {}),
    ...(role !== 'ALL' ? { role: role as Role } : {}),
  }
  
  // Fetch users with orders count for pagination
  const [users, totalUsers] = await Promise.all([
    prisma.user.findMany({
      where,
      take: pageSize,
      skip: (page - 1) * pageSize,
      orderBy: {
        [sortField === 'joined' ? 'createdAt' : sortField]: sortDirection,
      },
      include: {
        orders: {
          select: {
            id: true,
            total: true,
          },
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ])
  
  const totalPages = Math.ceil(totalUsers / pageSize)
  
  // Format users data
  const formattedUsers = users.map((user: UserWithOrders) => {
    const totalSpent = user.orders.reduce(
      (sum: number, order: { total: number }) => sum + Number(order.total),
      0
    )
    
    return {
      ...user,
      orderCount: user._count.orders,
      totalSpent,
    }
  })

  return (
    <div className='space-y-8'>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className='text-3xl font-bold tracking-tight'>User Management</h2>
          <p className='text-muted-foreground'>
            View and manage all user accounts
          </p>
        </div>
        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Link href="/admin/users/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <CardTitle>All Users ({totalUsers})</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..." 
                  className="pl-8 w-full sm:w-auto"
                  name="query"
                  defaultValue={query}
                />
              </div>
              <div className="flex gap-2">
                <Select defaultValue={role} name="role">
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Roles</SelectItem>
                    <SelectItem value="USER">Customers</SelectItem>
                    <SelectItem value="ADMIN">Administrators</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue={sort} name="sort">
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                    <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                    <SelectItem value="email-asc">Email (A-Z)</SelectItem>
                    <SelectItem value="email-desc">Email (Z-A)</SelectItem>
                    <SelectItem value="joined-desc">Newest</SelectItem>
                    <SelectItem value="joined-asc">Oldest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <UsersList 
            users={formattedUsers} 
            currentPage={page} 
            totalPages={totalPages}
            totalUsers={totalUsers}
          />
        </CardContent>
      </Card>
    </div>
  )
} 