import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Политика конфиденциальности',
  description: 'Политика конфиденциальности Toplap Store. Информация о безопасности ваших данных.'
}

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Политика конфиденциальности</h1>
      <p className="mb-4">
        Мы серьезно относимся к безопасности ваших личных данных.
      </p>
      <p>
        Страница находится в разработке.
      </p>
    </div>
  )
}
