'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useSocket } from '@/hooks/useSocket' // Для уведомлений о новом заказе

interface MockPaymentFormProps {
  orderId: string
}

export function MockPaymentForm({ orderId }: MockPaymentFormProps) {
  const [cardNumber, setCardNumber] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [cvv, setCvv] = useState('')
  const [country, setCountry] = useState('Нидерланды')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { emitNewOrder } = useSocket()

  // Форматирование номера карты для отображения с пробелами
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ''
    const parts = []

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }

    if (parts.length) {
      return parts.join(' ')
    } else {
      return value
    }
  }

  // Обработка изменения номера карты
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = formatCardNumber(e.target.value)
    setCardNumber(value)
  }

  // Обработка изменения срока действия
  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '')
    
    if (value.length > 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4)
    }
    
    setExpiryDate(value)
  }

  // Обработка изменения CVV
  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').substring(0, 3)
    setCvv(value)
  }

  // Обработка отправки формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Проверка ввода
    if (cardNumber.replace(/\s/g, '').length < 16) {
      toast({
        title: 'Ошибка',
        description: 'Введите корректный номер карты',
        variant: 'destructive',
      })
      setIsLoading(false)
      return
    }

    if (expiryDate.length < 5) {
      toast({
        title: 'Ошибка',
        description: 'Введите корректный срок действия',
        variant: 'destructive',
      })
      setIsLoading(false)
      return
    }

    if (cvv.length < 3) {
      toast({
        title: 'Ошибка',
        description: 'Введите корректный CVV код',
        variant: 'destructive',
      })
      setIsLoading(false)
      return
    }

    try {
      // Имитация API запроса
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Обновление статуса заказа через заглушку API
      const response = await fetch(`/api/mock-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          paymentDetails: {
            lastFourDigits: cardNumber.replace(/\s/g, '').slice(-4),
          }
        }),
      })

      if (!response.ok) {
        throw new Error('Ошибка при обработке платежа')
      }

      const data = await response.json()

      // Отправка уведомления о новом заказе через сокет
      if (data.order) {
        emitNewOrder(data.order)
      }

      toast({
        title: 'Успех!',
        description: 'Платеж успешно обработан',
      })

      // Перенаправление на страницу подтверждения заказа
      router.push(`/order-confirmation/${orderId}`)
    } catch (error) {
      console.error('[PAYMENT_ERROR]', error)
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Ошибка при обработке платежа',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="cardNumber">Номер карты</Label>
          <div className="relative">
            <Input
              id="cardNumber"
              placeholder="1234 1234 1234 1234"
              value={cardNumber}
              onChange={handleCardNumberChange}
              className="pr-16"
              maxLength={19}
              required
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex space-x-1">
              <span className="w-8 h-5 bg-red-600 rounded"></span>
              <span className="w-8 h-5 bg-blue-600 rounded"></span>
              <span className="w-8 h-5 bg-blue-800 rounded"></span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="expiryDate">Окончание срока действия</Label>
            <Input
              id="expiryDate"
              placeholder="ММ/ГГ"
              value={expiryDate}
              onChange={handleExpiryDateChange}
              maxLength={5}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cvv">Код безопасности</Label>
            <Input
              id="cvv"
              placeholder="CVC"
              value={cvv}
              onChange={handleCvvChange}
              type="password"
              maxLength={3}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">Страна</Label>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите страну" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Нидерланды">Нидерланды</SelectItem>
              <SelectItem value="Россия">Россия</SelectItem>
              <SelectItem value="США">США</SelectItem>
              <SelectItem value="Германия">Германия</SelectItem>
              <SelectItem value="Франция">Франция</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Обработка...' : 'Pay Now'}
        </Button>
      </form>
    </div>
  )
} 