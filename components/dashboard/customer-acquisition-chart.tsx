'use client'

import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface CustomerAcquisitionData {
  month: string
  newUsers: number
}

interface CustomerAcquisitionChartProps {
  data: CustomerAcquisitionData[]
}

export function CustomerAcquisitionChart({ data }: CustomerAcquisitionChartProps) {
  // Calculate moving average for trend line
  const dataWithTrend = useMemo(() => {
    const windowSize = 3 // 3-month moving average
    
    return data.map((item, index, array) => {
      let trend = item.newUsers
      
      if (index >= windowSize - 1) {
        let sum = 0
        for (let i = 0; i < windowSize; i++) {
          sum += array[index - i].newUsers
        }
        trend = sum / windowSize
      }
      
      return {
        ...item,
        trend: Math.round(trend),
      }
    })
  }, [data])

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={dataWithTrend}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 60,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="month" 
            angle={-45} 
            textAnchor="end"
            height={60}
          />
          <YAxis />
          <Tooltip 
            formatter={(value: number) => [`${value} new customers`, 'Acquisitions']}
            labelFormatter={(label) => `Month: ${label}`}
          />
          <Bar 
            dataKey="newUsers" 
            name="New Customers" 
            fill="#4f46e5" 
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
} 