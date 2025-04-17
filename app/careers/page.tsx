import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Карьера',
  description: 'Присоединяйтесь к команде Toplap Store. Ознакомьтесь с открытыми вакансиями и возможностями развития.'
}

export default function CareersPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Карьера в Toplap Store</h1>
      <p className="mb-4">
        Мы всегда ищем талантливых специалистов, которые разделяют нашу страсть к инновациям и технологиям.
      </p>
      <p>
        Страница находится в разработке. Скоро здесь появится информация о вакансиях.
      </p>
    </div>
  )
}
