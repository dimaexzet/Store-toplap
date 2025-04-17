import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Связаться с нами',
  description: 'Контактная информация Toplap Store. Свяжитесь с нашей службой поддержки.'
}

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Связаться с нами</h1>
      <p className="mb-4">
        Наша команда поддержки готова ответить на все ваши вопросы.
      </p>
      <p>
        Страница находится в разработке.
      </p>
    </div>
  )
}
