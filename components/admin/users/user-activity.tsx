'use client'

import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { OrderStatus } from '@prisma/client'
import { 
  ShoppingBag, 
  ShoppingCart, 
  Truck, 
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react'

// Type for order with number price
interface Order {
  id: string
  status: OrderStatus
  createdAt: Date
  updatedAt: Date
  total: number
}

// Activity item interface
interface ActivityItem {
  id: string
  icon: React.ReactNode
  title: string
  description: string
  date: Date
  status?: 'success' | 'pending' | 'error' | 'warning'
}

interface UserActivityProps {
  userId: string
  orders: Order[]
}

// Status to icon mapping
const getStatusIcon = (status: OrderStatus) => {
  switch (status) {
    case 'PENDING':
      return <Clock className="h-5 w-5 text-yellow-500" />
    case 'PROCESSING':
      return <ShoppingCart className="h-5 w-5 text-blue-500" />
    case 'SHIPPED':
      return <Truck className="h-5 w-5 text-purple-500" />
    case 'DELIVERED':
      return <CheckCircle className="h-5 w-5 text-green-500" />
    case 'CANCELLED':
      return <XCircle className="h-5 w-5 text-red-500" />
    case 'REFUNDED':
      return <AlertCircle className="h-5 w-5 text-orange-500" />
    default:
      return <ShoppingBag className="h-5 w-5 text-gray-500" />
  }
}

// Status to badge color mapping
const getStatusColor = (status: OrderStatus): 'success' | 'pending' | 'error' | 'warning' => {
  switch (status) {
    case 'PENDING': return 'warning'
    case 'PROCESSING': return 'pending'
    case 'SHIPPED': return 'pending'
    case 'DELIVERED': return 'success'
    case 'CANCELLED': return 'error'
    case 'REFUNDED': return 'warning'
    default: return 'pending'
  }
}

export function UserActivity({ userId, orders }: UserActivityProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([])

  useEffect(() => {
    // Create activity items from orders
    const orderActivities: ActivityItem[] = orders.flatMap(order => {
      // For each order, create at least one activity (the order creation)
      const items: ActivityItem[] = [{
        id: `order-created-${order.id}`,
        icon: <ShoppingBag className="h-5 w-5 text-primary" />,
        title: 'Placed an order',
        description: `Order #${order.id.substring(0, 8)} worth €${order.total.toFixed(2)}`,
        date: new Date(order.createdAt),
        status: 'success'
      }]

      // Add order status update as an activity (except for PENDING which is initial)
      if (order.status !== 'PENDING') {
        items.push({
          id: `order-status-${order.id}`,
          icon: getStatusIcon(order.status),
          title: `Order ${order.status.toLowerCase()}`,
          description: `Order #${order.id.substring(0, 8)} is now ${order.status.toLowerCase()}`,
          date: new Date(order.updatedAt),
          status: getStatusColor(order.status)
        })
      }
      
      return items
    })
    
    // Sort activities by date (newest first)
    const sortedActivities = orderActivities.sort((a, b) => 
      b.date.getTime() - a.date.getTime()
    )
    
    setActivities(sortedActivities)
  }, [orders])

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No recent activity found for this user.
      </div>
    )
  }

  return (
    <div className="space-y-0">
      <div className="relative">
        {activities.map((activity, index) => (
          <div 
            key={activity.id} 
            className={`relative pl-8 pb-8 ${
              index !== activities.length - 1 ? 'border-l ml-3' : ''
            }`}
          >
            <div className="absolute -left-3 top-0 bg-background p-1 rounded-full border">
              {activity.icon}
            </div>
            <div className="text-sm">
              <p className="font-medium">{activity.title}</p>
              <p className="text-muted-foreground">{activity.description}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(activity.date, { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 