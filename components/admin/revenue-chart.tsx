'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'
import { useMemo } from 'react'

interface RevenueData {
  date: string
  revenue: number
}

interface RevenueChartProps {
  data: RevenueData[]
}

export function RevenueChart({ data }: RevenueChartProps) {
  // Убедимся, что данные не пустые и корректно отформатированы
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      // Если данных нет, создадим фиктивные данные для 7 дней
      const dates = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      return dates.map(date => ({ date, revenue: 0 }))
    }
    return data
  }, [data])

  // Найдем максимальное значение дохода для настройки масштаба графика
  const maxRevenue = useMemo(() => {
    const max = Math.max(...chartData.map(item => item.revenue))
    return max > 0 ? max : 100 // Если все значения нулевые, устанавливаем базовую шкалу
  }, [chartData])

  // Вычисляем общий доход
  const totalRevenue = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.revenue, 0)
  }, [chartData])

  return (
    <Card className='col-span-full lg:col-span-4'>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Revenue Overview</CardTitle>
        <div className="text-sm text-muted-foreground">
          Total: {formatCurrency(totalRevenue)}
        </div>
      </CardHeader>
      <CardContent>
        <div className='h-[400px]'>
          <ResponsiveContainer width='100%' height='100%'>
            <AreaChart
              data={chartData}
              margin={{
                top: 10,
                right: 30,
                left: 0,
                bottom: 0,
              }}
            >
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis
                dataKey='date'
                tickLine={false}
                axisLine={false}
                dy={10}
                tick={{ fill: '#888888', fontSize: 12 }}
              />
              <YAxis
                tickFormatter={(value) => formatCurrency(value)}
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#888888', fontSize: 12 }}
                domain={[0, maxRevenue * 1.1]} // Устанавливаем диапазон с запасом вверху
                allowDecimals={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className='rounded-lg border bg-background p-2 shadow-sm'>
                        <div className='grid grid-cols-2 gap-2'>
                          <div className='flex flex-col'>
                            <span className='text-[0.70rem] uppercase text-muted-foreground'>
                              Date
                            </span>
                            <span className='font-bold text-muted-foreground'>
                              {payload[0].payload.date}
                            </span>
                          </div>
                          <div className='flex flex-col'>
                            <span className='text-[0.70rem] uppercase text-muted-foreground'>
                              Revenue
                            </span>
                            <span className='font-bold'>
                              {formatCurrency(payload[0].value as number)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Area
                type='monotone'
                dataKey='revenue'
                stroke='#2563eb'
                fill='#3b82f6'
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
