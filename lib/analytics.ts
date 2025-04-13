import prisma from '@/lib/prisma'
import { OrderStatus } from '@prisma/client'
import { startOfDay, subDays, format } from 'date-fns'

export async function getRevenueData(days: number = 30) {
  const endDate = startOfDay(new Date())
  const startDate = subDays(endDate, days)

  const orders = await prisma.order.findMany({
    where: {
      status: OrderStatus.DELIVERED,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      total: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  // Group orders by date and calculate daily revenue
  const dailyRevenue = orders.reduce((acc, order) => {
    const date = format(order.createdAt, 'MMM d')
    acc[date] = (acc[date] || 0) + Number(order.total)
    return acc
  }, {} as Record<string, number>)

  // Convert to array format for Recharts
  const data = Object.entries(dailyRevenue).map(([date, revenue]) => ({
    date,
    revenue,
  }))

  return data
}

export async function getOrderStats() {
  const endDate = new Date()
  const startDate = subDays(endDate, 30)

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

  return orderStats.map((stat) => ({
    name: stat.status,
    value: stat._count,
  }))
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

  // Get product details
  const productsWithDetails = await Promise.all(
    topProducts.map(async (item) => {
      const product = await prisma.product.findUnique({
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
      })
      
      return {
        ...product,
        imageUrl: product?.Image[0]?.url,
        totalSold: item._sum.quantity || 0,
        revenue: Number(item._sum.price) || 0,
      }
    })
  )

  return productsWithDetails
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

export async function getCustomers(limit?: number) {
  const customers = await prisma.user.findMany({
    take: limit,
    where: {
      role: 'USER',
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
          total: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Calculate total spent and order count
  return customers.map(customer => {
    const totalSpent = customer.orders.reduce(
      (sum, order) => sum + Number(order.total),
      0
    )
    
    return {
      ...customer,
      orderCount: customer.orders.length,
      totalSpent
    }
  })
}
