'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function EmailTestPage() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [connectionInfo, setConnectionInfo] = useState<any>(null)

  async function checkConnection() {
    try {
      setLoading(true)
      const response = await fetch('/api/email-debug')
      const data = await response.json()
      setConnectionInfo(data)
      console.log('Email connection info:', data)
    } catch (error) {
      console.error('Failed to check connection:', error)
      setConnectionInfo({ error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  async function sendTestEmail() {
    if (!email || !name) {
      alert('Please enter both email and name')
      return
    }
    
    try {
      setLoading(true)
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name }),
      })
      
      const data = await response.json()
      setResult(data)
      console.log('Test email result:', data)
    } catch (error) {
      console.error('Failed to send test email:', error)
      setResult({ error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Email System Test</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>SMTP Connection Test</CardTitle>
            <CardDescription>
              Check if email server connection is working correctly
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button 
              onClick={checkConnection} 
              disabled={loading}
            >
              {loading ? 'Checking...' : 'Check Connection'}
            </Button>
          </CardFooter>
          {connectionInfo && (
            <CardContent>
              <div className="p-4 bg-gray-100 rounded-md overflow-auto max-h-80">
                <pre className="text-xs">{JSON.stringify(connectionInfo, null, 2)}</pre>
              </div>
            </CardContent>
          )}
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Send Test Email</CardTitle>
            <CardDescription>
              Send a test email to verify email delivery
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Email Address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Your Name
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={sendTestEmail} 
              disabled={loading || !email || !name}
            >
              {loading ? 'Sending...' : 'Send Test Email'}
            </Button>
          </CardFooter>
          {result && (
            <CardContent>
              <div className="p-4 bg-gray-100 rounded-md overflow-auto max-h-80">
                <pre className="text-xs">{JSON.stringify(result, null, 2)}</pre>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
} 