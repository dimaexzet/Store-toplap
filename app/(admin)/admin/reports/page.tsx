import { ExportReports } from '@/components/admin/export-reports'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ReportsPage() {
  return (
    <div className='space-y-8'>
      <div>
        <h2 className='text-3xl font-bold tracking-tight'>Reports & Analytics</h2>
        <p className='text-muted-foreground'>
          Export data and generate reports for your business
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export section */}
        <ExportReports />

        {/* Report Templates */}
        <Card>
          <CardHeader>
            <CardTitle>Report Templates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">Sales Reports</h3>
              <div className="grid grid-cols-1 gap-2">
                <ReportTemplateButton 
                  name="Monthly Sales Overview" 
                  description="Sales trends and performance analysis" 
                />
                <ReportTemplateButton 
                  name="Product Performance" 
                  description="Best and worst selling products" 
                />
                <ReportTemplateButton 
                  name="Customer Analysis" 
                  description="Customer purchasing patterns" 
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">Inventory Reports</h3>
              <div className="grid grid-cols-1 gap-2">
                <ReportTemplateButton 
                  name="Low Stock Alert" 
                  description="Products with critically low inventory" 
                />
                <ReportTemplateButton 
                  name="Inventory Turnover" 
                  description="How quickly inventory is sold and replaced" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Financial Reports</h3>
              <div className="grid grid-cols-1 gap-2">
                <ReportTemplateButton 
                  name="Revenue by Category" 
                  description="Revenue breakdown by product category" 
                />
                <ReportTemplateButton 
                  name="Profit Margins" 
                  description="Product and category profit analysis" 
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ReportTemplateButton({ name, description }: { name: string, description: string }) {
  return (
    <button className="text-left p-3 border rounded-md hover:bg-muted transition-colors flex justify-between items-center">
      <div>
        <div className="font-medium">{name}</div>
        <div className="text-sm text-muted-foreground">{description}</div>
      </div>
      <div className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">Generate</div>
    </button>
  )
} 