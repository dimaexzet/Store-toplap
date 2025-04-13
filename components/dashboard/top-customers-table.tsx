'use client'

import Image from 'next/image'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Mail } from 'lucide-react'

interface Customer {
  id: string
  name: string
  email: string
  image: string | null
  totalSpent: number
  totalOrders: number
  averageOrderValue: number
  firstOrderDate: Date | null
  lastOrderDate: Date | null
}

interface TopCustomersTableProps {
  customers: Customer[]
}

export function TopCustomersTable({ customers }: TopCustomersTableProps) {
  // Find the maximum value for relative comparison
  const maxValue = Math.max(...customers.map(customer => customer.totalSpent))

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Orders</TableHead>
            <TableHead>Revenue</TableHead>
            <TableHead>Last Order</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => {
            const percentage = Math.round((customer.totalSpent / maxValue) * 100)
            
            return (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={customer.image || ''} alt={customer.name} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {customer.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{customer.name}</div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Mail className="mr-1 h-3 w-3" />
                        {customer.email}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{customer.totalOrders}</div>
                  <div className="text-sm text-muted-foreground">
                    ${customer.averageOrderValue.toFixed(2)} avg
                  </div>
                </TableCell>
                <TableCell>
                  <div className="w-full space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">
                        ${customer.totalSpent.toFixed(2)}
                      </span>
                      <span className="text-sm text-muted-foreground">{percentage}%</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                </TableCell>
                <TableCell>
                  {customer.lastOrderDate ? (
                    <div className="text-sm">
                      {new Date(customer.lastOrderDate).toLocaleDateString()}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">N/A</div>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
} 