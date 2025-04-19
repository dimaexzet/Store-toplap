import prisma from '@/lib/prisma'
import { OrderStatus } from '@prisma/client'
import { startOfDay, subDays, format, eachDayOfInterval, endOfDay, startOfMonth, endOfMonth } from 'date-fns'

export async function getTotalRevenue(days: number = 30) {
  const endDate = new Date()
  const startDate = subDays(endDate, days)

  const result = await prisma.order.aggregate({
    _sum: {
      total: true
    },
    where: {
      status: OrderStatus.DELIVERED,
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    }
  })

  return result._sum.total ? Number(result._sum.total) : 0
}

export async function getAverageOrderValue(days: number = 30) {
  const endDate = new Date()
  const startDate = subDays(endDate, days)

  const result = await prisma.order.aggregate({
    _avg: {
      total: true
    },
    where: {
      status: {
        not: OrderStatus.CANCELLED
      },
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    }
  })

  return result._avg.total ? Number(result._avg.total) : 0
}

export async function getRevenueData(days: number = 30) {
  const endDate = new Date()
  const startDate = subDays(endDate, days)

  const orders = await prisma.order.findMany({
    where: {
      status: {
        in: [OrderStatus.DELIVERED, OrderStatus.SHIPPED, OrderStatus.PROCESSING]
      },
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      id: true,
      total: true,
      createdAt: true,
      status: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  console.log(`Found ${orders.length} orders for revenue data in the period`)

  if (orders.length === 0) {
    console.log('No orders found, generating default data points')
    const interval = eachDayOfInterval({ start: startDate, end: endDate })
    return interval.slice(-7).map(date => ({
      date: format(date, 'MMM d'),
      revenue: 0
    }))
  }

  const dailyRevenue = orders.reduce((acc, order) => {
    const date = format(order.createdAt, 'MMM d')
    const orderTotal = Number(order.total)
    
    if (isNaN(orderTotal)) {
      console.warn(`Invalid order total for order ${order.id}: ${order.total}`)
      return acc
    }
    
    acc[date] = (acc[date] || 0) + orderTotal
    return acc
  }, {} as Record<string, number>)

  const data = Object.entries(dailyRevenue).map(([date, revenue]) => ({
    date,
    revenue,
  }))

  console.log(`Generated ${data.length} data points for revenue chart`)
  
  data.sort((a, b) => {
    const dateA = new Date(a.date)
    const dateB = new Date(b.date)
    return dateA.getTime() - dateB.getTime()
  })

  return data
}

export async function getOrderStats() {
  const endDate = new Date()
  const startDate = subDays(endDate, 30)

  // Получаем статистику по статусам заказов
  const orderStats = await prisma.order.groupBy({
    by: ['status'],
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    _count: true,
  })

  console.log('Order stats:', orderStats)

  // Если нет данных, возвращаем дефолтные значения
  if (!orderStats || orderStats.length === 0) {
    console.log('No order stats found, returning default values')
    return [
      { name: OrderStatus.PENDING, value: 0 },
      { name: OrderStatus.PROCESSING, value: 0 },
      { name: OrderStatus.SHIPPED, value: 0 },
      { name: OrderStatus.DELIVERED, value: 0 },
    ]
  }

  // Проверяем, что все статусы заказов представлены
  const result = []
  const statuses = [
    OrderStatus.PENDING, 
    OrderStatus.PROCESSING, 
    OrderStatus.SHIPPED, 
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED,
    OrderStatus.REFUNDED
  ]
  
  // Для каждого статуса находим его количество
  for (const status of statuses) {
    const stat = orderStats.find(s => s.status === status)
    result.push({
      name: status,
      value: stat ? stat._count : 0
    })
  }

  // Убираем статусы с нулевыми значениями для более чистого графика
  return result.filter(item => item.value > 0)
}

export async function getRecentOrders(limit: number = 5) {
  const orders = await prisma.order.findMany({
    take: limit,
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      total: true,
      status: true,
      createdAt: true,
      user: {
        select: {
          name: true,
          email: true
        },
      },
    },
  })

  // Convert Decimal to number for the total field
  return orders.map(order => ({
    ...order,
    total: Number(order.total)
  }));
}

export async function getLowStockProducts(limit: number = 5, threshold: number = 10) {
  const products = await prisma.product.findMany({
    take: limit,
    where: {
      stock: {
        lte: threshold
      }
    },
    select: {
      id: true,
      name: true,
      price: true,
      stock: true,
      Image: {
        take: 1,
        select: {
          url: true
        }
      }
    },
    orderBy: {
      stock: 'asc'
    }
  })

  return products
}

export async function getTopProducts(limit: number = 10) {
  // Get the most sold products based on order items
  const topProducts = await prisma.orderItem.groupBy({
    by: ['productId'],
    _sum: {
      quantity: true,
      price: true,
    },
    orderBy: {
      _sum: {
        quantity: 'desc',
      },
    },
    take: limit,
  })

  // Get product details using findMany with a where clause instead of findUnique
  const productsWithDetails = await Promise.all(
    topProducts.map(async (item) => {
      const products = await prisma.product.findMany({
        where: { id: item.productId },
        select: {
          id: true,
          name: true,
          price: true,
          stock: true,
          Image: {
            select: {
              url: true,
            },
            take: 1,
          },
        },
        take: 1
      })
      
      const product = products[0] || null
      
      if (!product) return null
      
      return {
        ...product,
        totalSold: item._sum.quantity || 0,
        revenue: Number(item._sum.price) || 0,
        imageUrl: product.Image[0]?.url || null
      }
    })
  )

  return productsWithDetails.filter(Boolean)
}

export async function getTopCustomers(limit: number = 5) {
  // Group orders by userId and sum the totals
  const topSpenders = await prisma.order.groupBy({
    by: ['userId'],
    _sum: {
      total: true
    },
    orderBy: {
      _sum: {
        total: 'desc'
      }
    },
    take: limit
  })
  
  // Get user details
  const users = await prisma.user.findMany({
    where: {
      id: {
        in: topSpenders.map(item => item.userId)
      }
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true
    }
  })
  
  // Combine the data
  return topSpenders.map(spender => {
    const user = users.find(u => u.id === spender.userId)
    return {
      ...user,
      totalSpent: Number(spender._sum.total || 0)
    }
  })
}

export async function getCustomerAcquisition(timeframe: 'daily' | 'weekly' | 'monthly' = 'daily', days: number = 30) {
  const endDate = new Date()
  const startDate = subDays(endDate, days)
  
  // Get total number of customers
  const totalCustomers = await prisma.user.count({
    where: {
      role: 'USER'
    }
  })
  
  // Create date intervals based on timeframe
  const dateIntervals = eachDayOfInterval({
    start: startDate,
    end: endDate
  })
  
  // Get acquisition data for each interval
  const timeSeries = await Promise.all(
    dateIntervals.map(async (date) => {
      let periodStart: Date
      let periodEnd: Date
      
      if (timeframe === 'daily') {
        periodStart = startOfDay(date)
        periodEnd = endOfDay(date)
      } else if (timeframe === 'weekly') {
        // For simplicity, we're using the day as a representative of its week
        periodStart = startOfDay(date)
        periodEnd = endOfDay(date)
      } else {
        // Monthly
        periodStart = startOfMonth(date)
        periodEnd = endOfMonth(date)
      }
      
      const count = await prisma.user.count({
        where: {
          role: 'USER',
          createdAt: {
            gte: periodStart,
            lte: periodEnd
          }
        }
      })
      
      return {
        date: format(date, 'yyyy-MM-dd'),
        value: count
      }
    })
  )
  
  return {
    totalCustomers,
    timeSeries
  }
}

export async function getInventoryData() {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      stock: true,
      Image: {
        select: {
          url: true,
        },
        take: 1,
      },
      category: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      stock: 'asc',
    },
  })

  // Convert Decimal to number and format image URL
  return products.map(product => ({
    ...product,
    price: Number(product.price),
    imageUrl: product.Image[0]?.url
  }))
}

export async function getAllOrders(limit?: number) {
  const orders = await prisma.order.findMany({
    take: limit,
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      total: true,
      status: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      items: {
        select: {
          quantity: true,
          price: true,
          product: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  })

  // Convert Decimal to number for the total field
  return orders.map(order => ({
    ...order,
    total: Number(order.total),
    orderItems: order.items.map(item => ({
      ...item,
      price: Number(item.price)
    }))
  }))
}

export async function getCustomers(limit: number = 10) {
  const customers = await prisma.user.findMany({
    take: limit,
    where: {
      role: 'USER'
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,
      orders: {
        select: {
          id: true,
          total: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
  
  // Calculate order count and total spent for each customer
  return customers.map(customer => {
    const orderCount = customer.orders.length
    const totalSpent = customer.orders.reduce((sum, order) => sum + Number(order.total), 0)
    
    return {
      ...customer,
      orderCount,
      totalSpent
    }
  })
}
