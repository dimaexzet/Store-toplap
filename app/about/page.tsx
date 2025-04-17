import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'О нас',
  description: 'Узнайте больше о компании Toplap Store, нашей истории, миссии и команде.'
}

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">О нас</h1>
      <p className="mb-4">
        Toplap Store - ваш надежный поставщик инновационной электроники и аксессуаров.
      </p>
      <p>
        Страница находится в разработке.
      </p>
    </div>
  )
}
