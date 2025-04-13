import { Metadata } from 'next'
import prisma from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, TrendingUp, ListFilter, Calendar } from 'lucide-react'
import { format } from 'date-fns'

export const metadata: Metadata = {
  title: 'Search Analytics - Admin',
  description: 'View search analytics and trending searches',
}

// Define SearchQuery type that matches your Prisma model
type SearchQuery = {
  term: string;
  count: number;
  lastSearchedAt: Date;
}

export default async function SearchAnalyticsPage() {
  // Get top searches
  const popularSearches = await prisma.$queryRaw<SearchQuery[]>`
    SELECT term, count, "lastSearchedAt" 
    FROM "SearchQuery" 
    WHERE LENGTH(term) > 2
    ORDER BY count DESC 
    LIMIT 20
  `;

  // Get recent searches
  const recentSearches = await prisma.$queryRaw<SearchQuery[]>`
    SELECT term, count, "lastSearchedAt" 
    FROM "SearchQuery" 
    WHERE LENGTH(term) > 2
    ORDER BY "lastSearchedAt" DESC 
    LIMIT 20
  `;

  // Calculate statistics
  const totalSearchCount = popularSearches.reduce((sum: number, item: SearchQuery) => sum + item.count, 0);
  const uniqueSearchTerms = await prisma.$queryRaw<[{count: number}]>`
    SELECT COUNT(*) as count FROM "SearchQuery"
  `;
  
  // Prepare data for the visualization
  const chartData = popularSearches.slice(0, 10).map(search => ({
    term: search.term,
    count: search.count,
    percentage: Math.round((search.count / totalSearchCount) * 100)
  }));
  
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Search Analytics</h2>
        <p className="text-muted-foreground">
          Monitor search behavior and discover what your customers are looking for
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Searches</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSearchCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Search Terms</CardTitle>
            <ListFilter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueSearchTerms[0]?.count || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Popular Search</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {popularSearches[0]?.term || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {popularSearches[0] ? `${popularSearches[0].count} searches` : ''}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latest Search</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recentSearches[0]?.term || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {recentSearches[0] 
                ? `${format(new Date(recentSearches[0].lastSearchedAt), 'PP p')}` 
                : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search Term Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Popular Search Terms Distribution</CardTitle>
          <CardDescription>
            Visual representation of most frequent search terms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {chartData.map((item) => (
              <div key={item.term} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium truncate max-w-[200px]">{item.term}</span>
                  <span className="text-muted-foreground">{item.count} ({item.percentage}%)</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary" 
                    style={{ width: `${item.percentage}%` }}
                    title={`${item.term}: ${item.count} searches (${item.percentage}%)`}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Popular Searches Table */}
      <Card>
        <CardHeader>
          <CardTitle>Popular Search Terms</CardTitle>
          <CardDescription>
            The most frequently searched terms by your customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-10 px-4 text-left align-middle font-medium">Search Term</th>
                  <th className="h-10 px-4 text-right align-middle font-medium">Search Count</th>
                  <th className="h-10 px-4 text-right align-middle font-medium">Last Searched</th>
                </tr>
              </thead>
              <tbody>
                {popularSearches.map((search: SearchQuery) => (
                  <tr key={search.term} className="border-b">
                    <td className="p-4 align-middle">{search.term}</td>
                    <td className="p-4 align-middle text-right">{search.count}</td>
                    <td className="p-4 align-middle text-right">
                      {format(new Date(search.lastSearchedAt), 'PP')}
                    </td>
                  </tr>
                ))}
                {popularSearches.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-muted-foreground">
                      No search data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Searches Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Searches</CardTitle>
          <CardDescription>
            The most recent search terms used by your customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-10 px-4 text-left align-middle font-medium">Search Term</th>
                  <th className="h-10 px-4 text-right align-middle font-medium">Search Count</th>
                  <th className="h-10 px-4 text-right align-middle font-medium">Searched At</th>
                </tr>
              </thead>
              <tbody>
                {recentSearches.map((search: SearchQuery) => (
                  <tr key={search.term} className="border-b">
                    <td className="p-4 align-middle">{search.term}</td>
                    <td className="p-4 align-middle text-right">{search.count}</td>
                    <td className="p-4 align-middle text-right">
                      {format(new Date(search.lastSearchedAt), 'PPp')}
                    </td>
                  </tr>
                ))}
                {recentSearches.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-muted-foreground">
                      No search data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 