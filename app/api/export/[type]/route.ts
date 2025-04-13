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

export async function POST(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  const session = await auth()
  
  // Check authentication and admin role
  if (!session?.user || session.user.role !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 401 })
  }
  
  try {
    const body = await request.json()
    const { startDate, endDate, format = 'csv' } = body
    const type = await params.type
    
    if (!startDate || !endDate) {
      return new NextResponse('Missing date range', { status: 400 })
    }
    
    let data: any[] = []
    let columns: string[] = []
    
    // Fetch the requested data type
    switch (type) {
      case 'orders':
        data = await prisma.order.findMany({
          where: {
            createdAt: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          },
          select: {
            id: true,
            status: true,
            total: true,
            createdAt: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        })
        
        // Transform data for CSV output
        data = data.map(order => ({
          id: order.id,
          customerName: order.user?.name,
          customerEmail: order.user?.email,
          status: order.status,
          total: Number(order.total),
          createdAt: order.createdAt,
        }))
        
        columns = ['id', 'customerName', 'customerEmail', 'status', 'total', 'createdAt']
        break
        
      case 'products':
        data = await prisma.product.findMany({
          select: {
            id: true,
            name: true,
            price: true,
            stock: true,
            category: {
              select: {
                name: true,
              },
            },
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        })
        
        // Transform data for CSV output
        data = data.map(product => ({
          id: product.id,
          name: product.name,
          category: product.category.name,
          price: Number(product.price),
          stock: product.stock,
          createdAt: product.createdAt,
        }))
        
        columns = ['id', 'name', 'category', 'price', 'stock', 'createdAt']
        break
        
      case 'customers':
        data = await prisma.user.findMany({
          where: {
            role: 'USER',
            createdAt: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          },
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            orders: {
              select: {
                id: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        })
        
        // Transform data for CSV output
        data = data.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          orderCount: user.orders.length,
          createdAt: user.createdAt,
        }))
        
        columns = ['id', 'name', 'email', 'orderCount', 'createdAt']
        break
        
      case 'revenue':
        // Get daily revenue in date range
        const orders = await prisma.order.findMany({
          where: {
            status: OrderStatus.DELIVERED,
            createdAt: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          },
          select: {
            total: true,
            createdAt: true,
          },
        })
        
        // Aggregate revenue by date
        const revenueByDate = orders.reduce((acc, order) => {
          const date = dateFormat(order.createdAt, 'yyyy-MM-dd')
          acc[date] = (acc[date] || 0) + Number(order.total)
          return acc
        }, {} as Record<string, number>)
        
        // Transform to array for CSV
        data = Object.entries(revenueByDate).map(([date, amount]) => ({
          date,
          revenue: amount,
        }))
        
        columns = ['date', 'revenue']
        break
        
      default:
        return new NextResponse(`Invalid export type: ${type}`, { status: 400 })
    }
    
    if (format === 'csv') {
      // Generate CSV data
      const csv = convertToCSV(data, columns)
      
      // Set response headers for download
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename=${type}-export-${dateFormat(new Date(), 'yyyy-MM-dd')}.csv`,
        },
      })
    } else if (format === 'pdf') {
      // For simplicity, we'll return a placeholder response
      // In a real implementation, you would use a PDF library
      return new NextResponse(
        JSON.stringify({ message: 'PDF generation not implemented in this demo' }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else {
      return new NextResponse(`Invalid format: ${format}`, { status: 400 })
    }
  } catch (error) {
    console.error('Export error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 