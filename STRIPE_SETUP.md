# Настройка интеграции Stripe

## 1. Получение ключей Stripe

1. Зарегистрируйтесь или войдите в свой аккаунт [Stripe Dashboard](https://dashboard.stripe.com/)
2. Перейдите в раздел Developers -> API keys
3. Получите следующие ключи:
   - Publishable key (для фронтенда)
   - Secret key (для бэкенда)

## 2. Настройка вебхуков

1. В Stripe Dashboard перейдите в Developers -> Webhooks
2. Нажмите "Add endpoint"
3. Укажите URL вашего вебхука: `https://your-domain.com/api/webhooks/stripe`
4. Выберите события для прослушивания:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `checkout.session.completed`
5. После создания вебхука, получите "Signing secret" для проверки подписей

## 3. Настройка переменных окружения

Добавьте следующие переменные в файл `.env.local`:

```
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_PUBLIC_KEY=pk_test_your_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 4. Тестирование интеграции

1. Запустите проект:
   ```
   npm run dev
   ```

2. Перейдите на страницу тестирования Stripe:
   ```
   http://localhost:3000/stripe-test
   ```

3. Используйте тестовые карты Stripe для проверки:
   - Успешный платеж: `4242 4242 4242 4242`
   - Требуется подтверждение: `4000 0025 0000 3155`
   - Платеж отклонен: `4000 0000 0000 0002`

## 5. Режим разработки

В режиме разработки можно использовать Stripe CLI для локального тестирования вебхуков:

1. Установите [Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Войдите в аккаунт:
   ```
   stripe login
   ```
3. Запустите прослушивание вебхуков:
   ```
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
4. Используйте выданный webhook secret в вашем `.env.local`

## 6. Переход в продакшн

Для использования в продакшне:

1. Переключите Stripe Dashboard в режим "Live"
2. Получите боевые ключи 
3. Обновите переменные окружения с тестовыми ключами на боевые
4. Настройте вебхуки для боевого окружения
5. Обязательно обеспечьте соответствие требованиям безопасности:
   - HTTPS для всех страниц с платежами
   - Правильная настройка CSP (Content Security Policy)
   - Проверка сумм заказов на сервере

## 7. Дополнительная документация

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe.js и Elements](https://stripe.com/docs/js)
- [Handling Failed Payments](https://stripe.com/docs/payments/handling-payment-events)
- [Stripe Testing](https://stripe.com/docs/testing) 