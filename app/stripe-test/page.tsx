'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/hooks/use-toast'

export default function StripeTestPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [stripeEnabled, setStripeEnabled] = useState(false)
  const [isTestMode, setIsTestMode] = useState(true)

  useEffect(() => {
    // Проверяем, настроен ли Stripe
    async function checkStripeStatus() {
      try {
        const response = await fetch('/api/stripe-keys')
        
        if (response.ok) {
          const data = await response.json()
          setStripeEnabled(true)
          setIsTestMode(data.isTestMode)
        } else {
          setStripeEnabled(false)
        }
      } catch (error) {
        console.error('Failed to check Stripe status:', error)
        setStripeEnabled(false)
      }
    }

    checkStripeStatus()
  }, [])

  const handlePaymentTest = async () => {
    setIsLoading(true)
    
    try {
      // Создаем тестовый заказ
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [
            {
              id: 'test-product-1',
              name: 'Test Product',
              price: 19.99,
              quantity: 1,
              image: 'https://via.placeholder.com/150',
            },
          ],
          shippingAddress: {
            street: '123 Test Street',
            city: 'Test City',
            state: 'TS',
            postalCode: '12345',
            country: 'US',
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      toast({
        title: 'Checkout Created',
        description: `Order ID: ${data.orderId}`,
      })

      if (isTestMode) {
        toast({
          title: 'Test Mode',
          description: 'This is a test payment. No actual charges will be made.',
        })
      }

      if (data.clientSecret) {
        // Здесь мы бы перенаправили на страницу оплаты
        // В реальном приложении это бы использовало Stripe Elements
        toast({
          title: 'Payment Ready',
          description: 'Client secret received. Ready for payment processing.',
        })
      }
    } catch (error) {
      console.error('Payment test error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Payment test failed',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Stripe Integration Test</h1>
      
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Stripe Status</h2>
        <div className="space-y-2 mb-6">
          <div className="flex items-center">
            <span className="font-medium mr-2">Integration Status:</span>
            <span
              className={`px-2 py-1 rounded text-sm ${
                stripeEnabled
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {stripeEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          
          {stripeEnabled && (
            <div className="flex items-center">
              <span className="font-medium mr-2">Mode:</span>
              <span
                className={`px-2 py-1 rounded text-sm ${
                  isTestMode
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {isTestMode ? 'Test Mode' : 'Live Mode'}
              </span>
            </div>
          )}
        </div>
        
        <Separator className="my-4" />
        
        <h2 className="text-xl font-semibold mb-4">Test Payment</h2>
        <p className="text-gray-600 mb-4">
          {isTestMode
            ? 'This is a test environment. No actual charges will be made.'
            : 'Warning: Live mode is active. Real charges will be processed.'}
        </p>
        
        <Button
          onClick={handlePaymentTest}
          disabled={isLoading || !stripeEnabled}
          className="w-full"
        >
          {isLoading ? 'Processing...' : 'Test Payment Flow'}
        </Button>
        
        {isTestMode && (
          <p className="text-sm text-gray-500 mt-4">
            For testing, you can use card number: 4242 4242 4242 4242<br />
            Any future expiry date, any 3 digit CVC, and any 5 digit postal code.
          </p>
        )}
      </Card>
    </div>
  )
} 