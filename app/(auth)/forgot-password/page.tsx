'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, ArrowRight, Loader2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import Link from 'next/link'
import { z } from 'zod'
import { emailSchema } from '@/lib/security'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [emailError, setEmailError] = useState<string | undefined>()
  const [touchedEmail, setTouchedEmail] = useState(false)
  const router = useRouter()

  const validateEmail = (value: string) => {
    try {
      emailSchema.parse(value)
      setEmailError(undefined)
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        setEmailError(error.errors[0]?.message || 'Invalid email')
      }
      return false
    }
  }

  const handleEmailBlur = () => {
    setTouchedEmail(true)
    validateEmail(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouchedEmail(true)
    
    // Validate email before submission
    if (!validateEmail(email)) {
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send password reset email')
      }
      
      setSuccess(true)
    } catch (error) {
      console.error('Error requesting password reset:', error)
      setError('An error occurred while sending the password reset link. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Forgot password</CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success ? (
            <Alert className="mb-4">
              <AlertTitle>Check your email</AlertTitle>
              <AlertDescription>
                If an account exists with this email, we've sent a password reset link.
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (touchedEmail) {
                      validateEmail(e.target.value)
                    }
                  }}
                  onBlur={handleEmailBlur}
                  required
                  disabled={isLoading}
                  className={emailError && touchedEmail ? "border-red-500" : ""}
                />
                {emailError && touchedEmail && (
                  <p className="text-sm text-red-500 mt-1">{emailError}</p>
                )}
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send reset link
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-center">
          <Link href="/sign-in" className="text-sm text-muted-foreground hover:underline">
            Return to sign in
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
} 