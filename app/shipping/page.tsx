import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Доставка',
  description: 'Информация о способах доставки и сроках в Toplap Store.'
}

export default function ShippingPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Информация о доставке</h1>
      <p className="mb-4">
        Узнайте о доступных способах доставки, сроках и стоимости.
      </p>
      <p>
        Страница находится в разработке.
      </p>
    </div>
  )
}
