import Link from 'next/link'
import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { Search, Home, ArrowLeft, ShoppingBag, HelpCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Страница не найдена | 404',
  description: 'Извините, запрашиваемая страница не существует или была перемещена',
  robots: {
    index: false,
    follow: true,
  },
}

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gray-50">
      <div className="text-center max-w-md mx-auto">
        <h1 className="text-9xl font-bold text-primary">404</h1>
        <h2 className="text-2xl font-semibold mt-4 mb-2">Страница не найдена</h2>
        <p className="text-muted-foreground mb-8">
          Извините, но страница, которую вы ищете, не существует, была удалена или временно недоступна.
        </p>

        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/">
                <Home className="mr-2 h-5 w-5" />
                На главную
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/products">
                <ShoppingBag className="mr-2 h-5 w-5" />
                К товарам
              </Link>
            </Button>
          </div>

          <div className="pt-6 border-t">
            <h3 className="text-lg font-medium mb-4">Возможно, вам пригодится:</h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  href="/" 
                  className="flex items-center text-primary hover:underline"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Вернуться на предыдущую страницу
                </Link>
              </li>
              <li>
                <Link 
                  href="/contact" 
                  className="flex items-center text-primary hover:underline"
                >
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Связаться с нами для помощи
                </Link>
              </li>
              <li>
                <Link 
                  href="/search" 
                  className="flex items-center text-primary hover:underline"
                >
                  <Search className="mr-2 h-4 w-4" />
                  Поиск по сайту
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 