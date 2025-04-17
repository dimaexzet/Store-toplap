import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Акции и скидки',
  description: 'Специальные предложения, акции и скидки на электронику в Toplap Store.'
}

export default function DealsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Акции и скидки</h1>
      <p className="mb-4">
        Ознакомьтесь с нашими текущими акциями и специальными предложениями.
      </p>
      <p>
        Страница находится в разработке.
      </p>
    </div>
  )
}
