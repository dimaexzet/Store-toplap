import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Возврат и обмен',
  description: 'Информация о политике возврата и обмена товаров в Toplap Store.'
}

export default function ReturnsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Возврат и обмен товаров</h1>
      <p className="mb-4">
        Ознакомьтесь с нашими правилами возврата и обмена товаров.
      </p>
      <p>
        Страница находится в разработке.
      </p>
    </div>
  )
}
