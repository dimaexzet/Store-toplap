'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

export default function EmailTestPage() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleTestEmail = async () => {
    if (!email || !name) {
      toast({
        title: 'Error',
        description: 'Please enter both email and name',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/test/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          name,
          type: 'test', // Тип тестового письма
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send test email')
      }

      setResult(data)
      toast({
        title: 'Success',
        description: 'Test email sent successfully',
      })
    } catch (error) {
      console.error('Test email error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send test email',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Email Service Test</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Mailgun Email Test</CardTitle>
          <CardDescription>
            Test the email service integration with Mailgun
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Recipient Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Recipient Name
              </label>
              <Input
                id="name"
                type="text"
                placeholder="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleTestEmail} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              'Send Test Email'
            )}
          </Button>
        </CardFooter>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-md overflow-auto">
              <pre className="text-sm text-gray-700">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 