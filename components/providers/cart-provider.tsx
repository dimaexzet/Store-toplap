'use client'

import { useEffect, useState } from 'react'
import { useCart } from '@/store/use-cart'
import { CartItem } from '@/store/use-cart'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // Простая гидратация через API persist
    useCart.persist.rehydrate()
    
    // Отмечаем, что гидратация завершена
    setTimeout(() => {
      setIsHydrated(true)
      
      // Устанавливаем флаг в состоянии корзины
      const cartStore = useCart.getState()
      if (typeof cartStore.setHydrated === 'function') {
        cartStore.setHydrated(true)
      }
    }, 100)
  }, [])

  // Показываем пустой DOM пока корзина не гидратирована
  if (!isHydrated) {
    return null // Prevent flash of incorrect content
  }

  return <>{children}</>
}
