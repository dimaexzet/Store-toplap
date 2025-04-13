import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import { OrderStatus } from '@prisma/client'
import { format as dateFormat } from 'date-fns'

// Helper function to convert data to CSV
function convertToCSV(data: any[], columns: string[]): string {
  // Create CSV header row
  const header = columns.join(',')
  
  // Create CSV content rows
  const rows = data.map(item => {
    return columns.map(column => {
      // Get the value for this column
      const value = column.split('.').reduce((obj, key) => obj?.[key], item)
      
      // Format the value properly for CSV
      if (value === null || value === undefined) return ''
      
      // Format dates
      if (value instanceof Date) return dateFormat(value, 'yyyy-MM-dd')
      
      // Format other values, escaping commas and quotes
      const stringValue = String(value)
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`
      }
      return stringValue
    }).join(',')
  }).join('\n')
  
  return header + '\n' + rows
}

type tParams = Promise<{ type: string }>

export async function POST(
  req: NextRequest,
  { params }: { params: tParams }
) {
  try {
    const session = await auth()
    
    // Check if user is authenticated and is an admin
    if (!session?.user || session.user.role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 })
    }
    
    const { type } = await params
    const { format = 'csv', dateRange } = await req.json()
    
    // Validate export type
    const validTypes = ['orders', 'products', 'customers', 'reviews']
    if (!validTypes.includes(type)) {
      return new NextResponse(`Invalid export type: ${type}`, { status: 400 })
    }
    
    // Validate format
    const validFormats = ['csv', 'json']
    if (!validFormats.includes(format)) {
      return new NextResponse(`Invalid format: ${format}`, { status: 400 })
    }
    
    // Process date range if provided
    let dateFilter = {}
    if (dateRange?.startDate && dateRange?.endDate) {
      dateFilter = {
        createdAt: {
          gte: new Date(dateRange.startDate),
          lte: new Date(dateRange.endDate),
        },
      }
    }
    
    // Get data based on type
    let data: any = []
    
    if (type === 'orders') {
      data = await prisma.order.findMany({
        where: dateFilter,
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          items: {
            include: {
              product: true,
            },
          },
          Address: true,
        },
        orderBy: { createdAt: 'desc' },
      })
      
      // Format the data for export
      data = data.map((order: any) => ({
        id: order.id,
        date: order.createdAt.toISOString(),
        customer: order.user?.name || 'Guest',
        email: order.user?.email || 'N/A',
        status: order.status,
        total: Number(order.total),
        items: order.items.length,
        shipping: order.Address 
          ? `${order.Address.street}, ${order.Address.city}, ${order.Address.country}` 
          : 'N/A',
      }))
    } 
    else if (type === 'products') {
      data = await prisma.product.findMany({
        include: {
          category: true,
          _count: {
            select: { orderItems: true, reviews: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
      
      // Format the data for export
      data = data.map((product: any) => ({
        id: product.id,
        name: product.name,
        category: product.category.name,
        price: Number(product.price),
        stock: product.stock,
        orders: product._count.orderItems,
        reviews: product._count.reviews,
        featured: product.featured ? 'Yes' : 'No',
      }))
    } 
    else if (type === 'customers') {
      data = await prisma.user.findMany({
        where: dateFilter,
        include: {
          _count: {
            select: { orders: true, reviews: true },
          },
          orders: {
            select: {
              total: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
      
      // Format the data for export
      data = data.map((user: any) => ({
        id: user.id,
        name: user.name || 'N/A',
        email: user.email,
        joined: user.createdAt.toISOString(),
        orders: user._count.orders,
        reviews: user._count.reviews,
        totalSpent: user.orders.reduce((sum: number, order: any) => sum + Number(order.total), 0),
      }))
    } 
    else if (type === 'reviews') {
      data = await prisma.review.findMany({
        where: dateFilter,
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          product: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
      
      // Format the data for export
      data = data.map((review: any) => ({
        id: review.id,
        date: review.createdAt.toISOString(),
        product: review.product.name,
        customer: review.user.name || 'Guest',
        rating: review.rating,
        comment: review.comment || 'No comment',
      }))
    }
    
    // Return data in requested format
    if (format === 'json') {
      return NextResponse.json({ data })
    } else {
      // Convert to CSV
      const csvHeader = Object.keys(data[0] || {}).join(',')
      const csvRows = data.map((row: any) => 
        Object.values(row).map(value => 
          typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
        ).join(',')
      )
      const csv = [csvHeader, ...csvRows].join('\n')
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename=${type}-export.csv`,
        },
      })
    }
  } catch (error) {
    console.error('Error exporting data:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 