'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function EmailDebugPage() {
  const [email, setEmail] = useState('')
  const [result, setResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const testMailgun = async () => {
    try {
      setIsLoading(true)
      setResult(null)
      
      const testEmail = email || 'test@example.com'
      const response = await fetch(`/api/test/emaildebug?email=${encodeURIComponent(testEmail)}`)
      const data = await response.json()
      
      setResult(data)
    } catch (error) {
      console.error('Error testing Mailgun:', error)
      setResult({ error: String(error) })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Mailgun Debug</h1>
      
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Test Mailgun API Directly</CardTitle>
          <CardDescription>
            This test bypasses standard routes and connects directly to Mailgun API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Recipient Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="test@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Must be an authorized recipient for sandbox domains
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={testMailgun} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Testing...' : 'Test Mailgun API'}
          </Button>
        </CardFooter>
      </Card>
      
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>
              {result.success ? '✅ Success' : '❌ Error'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 