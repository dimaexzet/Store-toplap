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
import { signIn } from 'next-auth/react'
import { emailSchema, nameSchema, passwordSchema } from '@/lib/security'
import { z } from 'zod'

// Create a schema for the form
const signUpSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

type FormErrors = {
  name?: string[];
  email?: string[];
  password?: string[];
  confirmPassword?: string[];
}

export default function SignUpPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const validateField = (field: keyof FormErrors, value: string) => {
    try {
      if (field === 'name') {
        nameSchema.parse(value);
      } else if (field === 'email') {
        emailSchema.parse(value);
      } else if (field === 'password') {
        passwordSchema.parse(value);
      } else if (field === 'confirmPassword') {
        if (value !== password) {
          throw new Error("Passwords don't match");
        }
      }
      
      // Clear errors for this field if validation passes
      setFormErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
      
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setFormErrors(prev => ({
          ...prev,
          [field]: error.errors.map(e => e.message)
        }));
      } else if (error instanceof Error) {
        setFormErrors(prev => ({
          ...prev,
          [field]: [error.message]
        }));
      }
      return false;
    }
  }

  const handleBlur = (field: keyof FormErrors) => {
    setTouched(prev => ({
      ...prev,
      [field]: true
    }));
    
    if (field === 'name') validateField('name', name);
    if (field === 'email') validateField('email', email);
    if (field === 'password') validateField('password', password);
    if (field === 'confirmPassword') validateField('confirmPassword', confirmPassword);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Validate all fields
    const nameValid = validateField('name', name);
    const emailValid = validateField('email', email);
    const passwordValid = validateField('password', password);
    const confirmPasswordValid = validateField('confirmPassword', confirmPassword);

    // Only proceed if all validations pass
    if (!nameValid || !emailValid || !passwordValid || !confirmPasswordValid) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong')
      }

      // Sign in the user after successful registration
      await signIn('credentials', {
        redirect: false,
        email,
        password,
      })

      router.push('/dashboard')
      router.refresh()
    } catch (error: any) {
      console.error('Registration error:', error)
      setError(error.message || 'Failed to create account. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>
            Enter your information to create an account
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
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => handleBlur('name')}
                required
                disabled={isLoading}
                className={formErrors.name && touched.name ? "border-red-500" : ""}
              />
              {formErrors.name && touched.name && (
                <p className="text-sm text-red-500 mt-1">{formErrors.name[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => handleBlur('email')}
                required
                disabled={isLoading}
                className={formErrors.email && touched.email ? "border-red-500" : ""}
              />
              {formErrors.email && touched.email && (
                <p className="text-sm text-red-500 mt-1">{formErrors.email[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => handleBlur('password')}
                required
                disabled={isLoading}
                className={formErrors.password && touched.password ? "border-red-500" : ""}
              />
              {formErrors.password && touched.password && (
                <p className="text-sm text-red-500 mt-1">{formErrors.password[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => handleBlur('confirmPassword')}
                required
                disabled={isLoading}
                className={formErrors.confirmPassword && touched.confirmPassword ? "border-red-500" : ""}
              />
              {formErrors.confirmPassword && touched.confirmPassword && (
                <p className="text-sm text-red-500 mt-1">{formErrors.confirmPassword[0]}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Sign up
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center">
          <div className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/sign-in" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
} 