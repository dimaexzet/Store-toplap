import { Metadata } from 'next'
import { ContactForm } from '@/components/contact/contact-form'

export const metadata: Metadata = {
  title: 'Связаться с нами | Toplap Store',
  description: 'Свяжитесь с нами по любым вопросам, предложениям или проблемам. Наша команда поддержки всегда готова помочь.',
}

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-center">Свяжитесь с нами</h1>
      
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Контактная информация</h2>
            <div className="space-y-4">
              <div>
                <p className="font-medium">Адрес:</p>
                <p className="text-gray-600">ул. Примерная, 123</p>
                <p className="text-gray-600">Москва, 123456</p>
              </div>
              
              <div>
                <p className="font-medium">Телефон:</p>
                <p className="text-gray-600">+7 (800) 123-45-67</p>
              </div>
              
              <div>
                <p className="font-medium">Email:</p>
                <p className="text-gray-600">info@toplap.store</p>
              </div>
              
              <div>
                <p className="font-medium">Часы работы:</p>
                <p className="text-gray-600">Пн-Пт: 9:00 - 18:00</p>
                <p className="text-gray-600">Сб: 10:00 - 16:00</p>
                <p className="text-gray-600">Вс: Выходной</p>
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Отправить сообщение</h2>
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  )
} 