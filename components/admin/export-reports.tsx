'use client'

import { useState } from 'react'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, FileText, Download, FileDown } from 'lucide-react'
import { cn } from '@/lib/utils'

type ExportDataType = 'orders' | 'products' | 'customers' | 'revenue'

export function ExportReports() {
  const [startDate, setStartDate] = useState<Date | undefined>(new Date())
  const [endDate, setEndDate] = useState<Date | undefined>(new Date())
  const [dataType, setDataType] = useState<ExportDataType>('orders')
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleExport = async () => {
    if (!startDate || !endDate) return

    setIsGenerating(true)

    try {
      // Make API request to our endpoint
      const response = await fetch(`/api/export/${dataType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          format: exportFormat
        }),
      })

      if (!response.ok) throw new Error('Export failed')

      // For CSV: Get the blob and trigger download
      if (exportFormat === 'csv') {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${dataType}-${format(startDate, 'yyyy-MM-dd')}-to-${format(endDate, 'yyyy-MM-dd')}.${exportFormat}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        // For PDF: Just show an alert for now
        const data = await response.json()
        alert(data.message || 'PDF generation is not implemented in this demo')
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export data. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  // For demo purposes, we'll simulate export without an actual API
  const handleDemoExport = () => {
    setIsGenerating(true)
    
    // Simulate API delay
    setTimeout(() => {
      // Create a simple CSV string (in a real app, this would come from the API)
      let csvContent = ''
      
      if (dataType === 'orders') {
        csvContent = 'Order ID,Customer,Date,Status,Total\n'
          + 'ORD-001,John Doe,2023-05-01,DELIVERED,$120.50\n'
          + 'ORD-002,Jane Smith,2023-05-02,PROCESSING,$75.20\n'
          + 'ORD-003,Mike Johnson,2023-05-03,PENDING,$210.75\n'
      } else if (dataType === 'products') {
        csvContent = 'Product ID,Name,Category,Price,Stock\n'
          + 'PRD-001,Smartphone X,Electronics,$899.99,25\n'
          + 'PRD-002,Wireless Headphones,Audio,$149.99,42\n'
          + 'PRD-003,Laptop Pro,Computers,$1299.99,15\n'
      }
      
      // Create a blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${dataType}-${format(startDate || new Date(), 'yyyy-MM-dd')}-to-${format(endDate || new Date(), 'yyyy-MM-dd')}.csv`
      document.body.appendChild(a)
      a.click()
      URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      setIsGenerating(false)
    }, 1500)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export & Reports</CardTitle>
        <CardDescription>
          Export data and generate reports for your business analytics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date Range Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PPP') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Data Type Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Data Type</label>
            <Select value={dataType} onValueChange={(value: ExportDataType) => setDataType(value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select data type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="orders">Orders</SelectItem>
                <SelectItem value="products">Products</SelectItem>
                <SelectItem value="customers">Customers</SelectItem>
                <SelectItem value="revenue">Revenue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Export Format Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Export Format</label>
            <div className="flex space-x-2">
              <Button 
                onClick={() => setExportFormat('csv')}
                variant={exportFormat === 'csv' ? 'default' : 'outline'}
                className={cn(
                  "flex-1",
                  exportFormat === 'csv' ? '' : 'text-muted-foreground'
                )}
              >
                <FileText className="mr-2 h-4 w-4" />
                CSV
              </Button>
              <Button 
                onClick={() => setExportFormat('pdf')}
                variant={exportFormat === 'pdf' ? 'default' : 'outline'}
                className={cn(
                  "flex-1",
                  exportFormat === 'pdf' ? '' : 'text-muted-foreground'
                )}
              >
                <FileDown className="mr-2 h-4 w-4" />
                PDF
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleExport} 
          disabled={isGenerating || !startDate || !endDate}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <svg
                className="mr-2 h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Generating...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export {dataType}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
} 