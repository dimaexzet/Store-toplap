import { MetricsCards } from '@/components/admin/metrics-cards'
import { RevenueChart } from '@/components/admin/revenue-chart'
import { OrderStats } from '@/components/admin/order-stats'
import { RecentOrders } from '@/components/admin/recent-orders'
import { getRevenueData, getOrderStats, getRecentOrders } from '@/lib/analytics'
import RealTimeNotifications from '@/components/admin/RealTimeNotifications'
import { Suspense } from 'react'

// Предотвращаем статическую генерацию для страницы админ-панели
export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const [revenueData, orderStats, recentOrders] = await Promise.all([
    getRevenueData(),
    getOrderStats(),
    getRecentOrders(5),
  ])

  return (
    <div className='space-y-8'>
      <div>
        <h2 className='text-3xl font-bold tracking-tight'>Dashboard</h2>
        <p className='text-muted-foreground'>Welcome to your admin dashboard</p>
      </div>

      {/* Key Metrics */}
      <MetricsCards />

      {/* Charts Grid */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7'>
        <div className="lg:col-span-4">
          <RevenueChart data={revenueData} />
        </div>
        <div className="lg:col-span-3">
          <OrderStats data={orderStats} />
        </div>
      </div>

      {/* Additional Dashboard Widgets */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-12'>
        {/* Recent Orders - Takes more space */}
        <div className='md:col-span-8'>
          <RecentOrders orders={recentOrders} />
        </div>
        
        {/* Real-time Updates - Right side panel */}
        <div className='md:col-span-4'>
          <Suspense fallback={<div className="h-[400px] rounded-md border animate-pulse" />}>
            <RealTimeNotifications />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
