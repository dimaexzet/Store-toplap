'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import Script from 'next/script'

// Define a type for FAQ items
export interface FAQItem {
  question: string
  answer: string
}

// Common FAQs that will be shown on all product pages
const commonFAQs: FAQItem[] = [
  {
    question: 'Какие способы оплаты вы принимаете?',
    answer: 'Мы принимаем оплату банковскими картами (Visa, MasterCard), электронными платежами и наложенным платежом при доставке.'
  },
  {
    question: 'Как долго занимает доставка?',
    answer: 'Стандартная доставка занимает 3-5 рабочих дней. Экспресс-доставка доступна в пределах 1-2 рабочих дней для некоторых регионов.'
  },
  {
    question: 'Какая гарантия предоставляется на товары?',
    answer: 'Все товары имеют стандартную гарантию производителя на срок не менее 12 месяцев. Некоторые товары имеют расширенную гарантию до 2-3 лет.'
  },
  {
    question: 'Как оформить возврат товара?',
    answer: 'Вы можете оформить возврат товара в течение 14 дней с момента получения. Для этого свяжитесь с нашей службой поддержки и предоставьте номер заказа.'
  }
]

interface ProductFAQProps {
  productName: string
  productId: string
  customFAQs?: FAQItem[]
}

export function ProductFAQ({ productName, productId, customFAQs = [] }: ProductFAQProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  
  // Combine custom FAQs with common FAQs
  const allFAQs = [...customFAQs, ...commonFAQs]
  
  const toggleFAQ = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index)
  }

  return (
    <div className="py-6">
      <h2 className="text-2xl font-bold mb-6">Часто задаваемые вопросы</h2>
      
      <div className="space-y-4">
        {allFAQs.map((faq, index) => (
          <div key={index} className="border rounded-lg overflow-hidden">
            <button
              className="flex items-center justify-between w-full p-4 text-left hover:bg-gray-50 transition-colors"
              onClick={() => toggleFAQ(index)}
              aria-expanded={expandedIndex === index}
              aria-controls={`faq-answer-${index}`}
            >
              <span className="font-medium">{faq.question}</span>
              {expandedIndex === index ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </button>
            
            {expandedIndex === index && (
              <div 
                id={`faq-answer-${index}`}
                className="p-4 pt-0 text-gray-600"
              >
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* FAQ structured data */}
      <Script
        id="faq-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": allFAQs.map(faq => ({
              "@type": "Question",
              "name": faq.question,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
              }
            }))
          })
        }}
      />
    </div>
  )
} 