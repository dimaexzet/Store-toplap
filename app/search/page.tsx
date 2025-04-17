import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Поиск товаров',
  description: 'Поиск по каталогу товаров Toplap Store'
}

export default function SearchPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Поиск товаров</h1>
      <p>
        Страница находится в разработке.
      </p>
    </div>
  )
}
