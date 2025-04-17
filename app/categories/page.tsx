import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Категории товаров',
  description: 'Ознакомьтесь с полным каталогом категорий нашего магазина электроники.'
}

export default function CategoriesPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Категории товаров</h1>
      <p className="mb-4">
        Выберите категорию для просмотра товаров.
      </p>
      <p>
        Страница находится в разработке.
      </p>
    </div>
  )
}
