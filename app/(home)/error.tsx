'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function HomeError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Логирование ошибки на сервер
    console.error('Ошибка на главной странице:', error)
  }, [error])

  return (
    <div className="container mx-auto py-16 px-4" role="alert" aria-labelledby="error-title">
      <div className="max-w-2xl mx-auto flex flex-col items-center text-center space-y-8">
        <div className="bg-red-100 p-4 rounded-full">
          <AlertCircle className="h-12 w-12 text-red-600" aria-hidden="true" />
        </div>

        <div className="space-y-4">
          <h1 id="error-title" className="text-3xl font-bold">Что-то пошло не так</h1>
          
          <div className="text-gray-600 space-y-2">
            <p>Произошла ошибка при загрузке страницы.</p>
            <p className="text-sm italic">{error.message || 'Неизвестная ошибка'}</p>
          </div>
        </div>

        <div className="space-y-4">
          <Button 
            onClick={reset} 
            variant="default" 
            size="lg"
            className="px-6"
          >
            Попробовать снова
          </Button>
          
          <div>
            <Button 
              variant="outline" 
              asChild
            >
              <a href="/">Вернуться на главную</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 