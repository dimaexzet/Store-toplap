'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, ArrowRight, Loader2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import Link from 'next/link'
import { z } from 'zod'
import { emailSchema, passwordSchema } from '@/lib/security'

// Create sign in validation schema
const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

type FormErrors = {
  email?: string;
  password?: string;
}

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({})

  // Validate an individual field
  const validateField = (field: 'email' | 'password', value: string) => {
    try {
      if (field === 'email') {
        emailSchema.parse(value)
      } else if (field === 'password') {
        passwordSchema.parse(value)
      }
      
      // Clear error for this field if validation passes
      setFormErrors(prev => ({ ...prev, [field]: undefined }))
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors[0]?.message || `Invalid ${field}`
        setFormErrors(prev => ({ ...prev, [field]: errorMessage }))
      }
      return false
    }
  }

  // Validate the entire form
  const validateForm = () => {
    try {
      signInSchema.parse({ email, password })
      setFormErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: FormErrors = {}
        error.errors.forEach(err => {
          const field = err.path[0] as keyof FormErrors
          newErrors[field] = err.message
        })
        setFormErrors(newErrors)
      }
      return false
    }
  }

  // Handle input blur events for validation
  const handleBlur = (field: 'email' | 'password') => {
    setTouchedFields(prev => ({ ...prev, [field]: true }))
    
    if (field === 'email') {
      validateField('email', email)
    } else if (field === 'password') {
      validateField('password', password)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Mark all fields as touched
    setTouchedFields({ email: true, password: true })
    
    // Validate all fields before submission
    if (!validateForm()) {
      return
    }
    
    setIsLoading(true)
    setError(null)

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      })

      if (!result?.ok) {
        throw new Error('Invalid email or password')
      }

      router.push(callbackUrl)
      router.refresh()
    } catch (error) {
      console.error('Authentication error:', error)
      setError('Invalid email or password. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
          <CardDescription>
            Enter your email and password to access your account
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
                  if (touchedFields.email) {
                    validateField('email', e.target.value)
                  }
                }}
                onBlur={() => handleBlur('email')}
                required
                disabled={isLoading}
                className={formErrors.email && touchedFields.email ? "border-red-500" : ""}
              />
              {formErrors.email && touchedFields.email && (
                <p className="text-sm text-red-500 mt-1">{formErrors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link 
                  href="/forgot-password" 
                  className="text-sm text-muted-foreground hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (touchedFields.password) {
                    validateField('password', e.target.value)
                  }
                }}
                onBlur={() => handleBlur('password')}
                required
                disabled={isLoading}
                className={formErrors.password && touchedFields.password ? "border-red-500" : ""}
              />
              {formErrors.password && touchedFields.password && (
                <p className="text-sm text-red-500 mt-1">{formErrors.password}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center">
          <div className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/sign-up" className="text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
} 