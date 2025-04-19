'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Check, Loader2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import Link from 'next/link'
import { z } from 'zod'
import { passwordSchema } from '@/lib/security'

// Reset password validation schema
const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

type FormErrors = {
  password?: string;
  confirmPassword?: string;
}

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isValidToken, setIsValidToken] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({})
  
  const router = useRouter()
  const searchParams = useSearchParams()
  
  useEffect(() => {
    const tokenParam = searchParams.get('token')
    const emailParam = searchParams.get('email')
    
    if (tokenParam && emailParam) {
      setToken(tokenParam)
      setEmail(emailParam)
      setIsValidToken(true)
    } else {
      setError('Invalid or missing token. Please try requesting a new password reset link.')
    }
  }, [searchParams])

  // Validate an individual field
  const validateField = (field: 'password' | 'confirmPassword', value: string) => {
    try {
      if (field === 'password') {
        passwordSchema.parse(value)
      } else if (field === 'confirmPassword') {
        // Check if passwords match
        if (value !== password) {
          throw new z.ZodError([
            {
              code: 'custom',
              message: "Passwords don't match",
              path: ['confirmPassword']
            }
          ])
        }
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
      resetPasswordSchema.parse({ password, confirmPassword })
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
  const handleBlur = (field: 'password' | 'confirmPassword') => {
    setTouchedFields(prev => ({ ...prev, [field]: true }))
    
    validateField(field, field === 'password' ? password : confirmPassword)
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Mark all fields as touched
    setTouchedFields({ password: true, confirmPassword: true })
    
    // Validate all fields before submission
    if (!validateForm()) {
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    if (!token || !email) {
      setError('Missing token or email')
      setIsLoading(false)
      return
    }
    
    try {
      const response = await fetch('/api/auth/reset-password/change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          email,
          password,
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong')
      }
      
      setSuccess(true)
      setPassword('')
      setConfirmPassword('')
      
      // Redirect to sign in after 3 seconds
      setTimeout(() => {
        router.push('/sign-in')
      }, 3000)
    } catch (error: any) {
      console.error('Password reset error:', error)
      setError(error.message || 'Failed to reset password. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
          <CardDescription>
            Enter your new password
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
          
          {success && (
            <Alert className="mb-4 border-green-500 bg-green-50">
              <Check className="h-4 w-4 text-green-500" />
              <AlertTitle className="text-green-600">Success</AlertTitle>
              <AlertDescription className="text-green-600">
                Your password has been reset successfully. You will be redirected to the sign-in page.
              </AlertDescription>
            </Alert>
          )}
          
          {!success && (
            isValidToken && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (touchedFields.password) {
                        validateField('password', e.target.value)
                      }
                      if (touchedFields.confirmPassword && confirmPassword) {
                        validateField('confirmPassword', confirmPassword)
                      }
                    }}
                    onBlur={() => handleBlur('password')}
                    required
                    disabled={isLoading}
                    placeholder="Enter new password"
                    className={formErrors.password && touchedFields.password ? "border-red-500" : ""}
                  />
                  {formErrors.password && touchedFields.password && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.password}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      if (touchedFields.confirmPassword) {
                        validateField('confirmPassword', e.target.value)
                      }
                    }}
                    onBlur={() => handleBlur('confirmPassword')}
                    required
                    disabled={isLoading}
                    placeholder="Confirm new password"
                    className={formErrors.confirmPassword && touchedFields.confirmPassword ? "border-red-500" : ""}
                  />
                  {formErrors.confirmPassword && touchedFields.confirmPassword && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.confirmPassword}</p>
                  )}
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting password...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </form>
            )
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