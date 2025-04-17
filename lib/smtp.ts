import nodemailer from 'nodemailer';
import { formatCurrency } from '@/lib/utils';

// Настройки SMTP
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.eu.mailgun.org';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || 'postmaster@sandbox10c96c42fded4deaa2c239a8c091d20b.mailgun.org';
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || '';
const SENDER_NAME = process.env.SENDER_NAME || 'Toplap';
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'mail@toplap.store';
// const MAILGUN_TESTMODE = process.env.MAILGUN_TESTMODE === 'true';
// Временно отключим тестовый режим, пока не разберемся с проблемой
const MAILGUN_TESTMODE = false;

// Создаем транспорт Nodemailer
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: false, // true для 465, false для других портов
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASSWORD,
  },
});

/**
 * Базовая функция для отправки email через SMTP
 */
export async function sendEmail(to: string, subject: string, html: string) {
  if (!SMTP_PASSWORD) {
    console.warn('Email sending skipped - SMTP password is missing');
    return { success: false, error: 'SMTP password not configured' };
  }

  // If in test mode, log email details instead of actually sending
  if (MAILGUN_TESTMODE) {
    console.log('------------- TEST MODE EMAIL (SMTP) -------------');
    console.log(`From: ${SENDER_NAME} <${SENDER_EMAIL}>`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('HTML content available but not shown');
    console.log('------------------------------------------');
    
    return { 
      success: true, 
      data: { 
        messageId: `test-email-${Date.now()}@smtp.test`,
        message: 'Email logged in test mode (not actually sent)' 
      } 
    };
  }

  try {
    const mailOptions = {
      from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
    return { success: true, data: info };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error };
  }
}

/**
 * Отправка письма с подтверждением заказа
 */
export async function sendOrderConfirmationEmail(
  email: string,
  name: string,
  orderId: string,
  orderItems: any[],
  shippingAddress: any,
  total: number
) {
  try {
    // Форматирование списка товаров в HTML
    const orderItemsHtml = orderItems
      .map(
        (item) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">
            <img src="${item.product.Image?.[0]?.url || '/placeholder.png'}" alt="${
          item.product.name
        }" width="50" height="50" style="border-radius: 5px;">
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${
            item.product.name
          }</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">x${
            item.quantity
          }</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${formatCurrency(
            Number(item.price)
          )}</td>
        </tr>
      `
      )
      .join('');
      
    // Расчет подытогов
    const itemsTotal = orderItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
    const shippingFee = total * 0.05; // Примерно 5% от суммы заказа
    const tax = total * 0.1; // Примерно 10% налог

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333; text-align: center;">Подтверждение заказа</h1>
        <p>Здравствуйте, ${name}!</p>
        <p>Спасибо за ваш заказ! Мы обрабатываем его и сообщим вам, когда он будет отправлен.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h2 style="margin-top: 0;">Заказ #${orderId.substring(0, 8)}</h2>
          <p><strong>Дата:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Способ оплаты:</strong> STRIPE</p>
          <p><strong>Адрес доставки:</strong><br>
            ${name}<br>
            ${shippingAddress.street}<br>
            ${shippingAddress.city}, ${shippingAddress.state} ${
      shippingAddress.postalCode
    }<br>
            ${shippingAddress.country}
          </p>
        </div>
        
        <h3>Товары в заказе</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th style="padding: 10px; text-align: left;">Изображение</th>
              <th style="padding: 10px; text-align: left;">Товар</th>
              <th style="padding: 10px; text-align: left;">Количество</th>
              <th style="padding: 10px; text-align: left;">Цена</th>
            </tr>
          </thead>
          <tbody>
            ${orderItemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="padding: 10px; text-align: right;"><strong>Подытог:</strong></td>
              <td style="padding: 10px;">${formatCurrency(
                itemsTotal
              )}</td>
            </tr>
            <tr>
              <td colspan="3" style="padding: 10px; text-align: right;"><strong>Доставка:</strong></td>
              <td style="padding: 10px;">${formatCurrency(
                shippingFee
              )}</td>
            </tr>
            <tr>
              <td colspan="3" style="padding: 10px; text-align: right;"><strong>Налог:</strong></td>
              <td style="padding: 10px;">${formatCurrency(tax)}</td>
            </tr>
            <tr>
              <td colspan="3" style="padding: 10px; text-align: right;"><strong>Итого:</strong></td>
              <td style="padding: 10px; font-weight: bold;">${formatCurrency(
                total
              )}</td>
            </tr>
          </tfoot>
        </table>
        
        <p>Если у вас есть вопросы, пожалуйста, свяжитесь с нашей службой поддержки.</p>
        <p>Спасибо за покупку!</p>
        <p>Команда ${SENDER_NAME}</p>
      </div>
    `;

    return await sendEmail(
      email,
      `Подтверждение заказа #${orderId.substring(0, 8)}`,
      emailHtml
    );
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
    return { success: false, error };
  }
}

/**
 * Отправка письма с обновлением статуса заказа
 */
export async function sendShippingUpdateEmail(
  email: string,
  name: string,
  orderId: string,
  status: string,
  trackingNumber?: string
) {
  try {
    // Настройка сообщения в зависимости от статуса
    let statusMessage = '';
    let subject = '';

    switch (status) {
      case 'PROCESSING':
        subject = `Ваш заказ #${orderId.substring(0, 8)} обрабатывается`;
        statusMessage = 'Ваш заказ сейчас обрабатывается и скоро будет отправлен.';
        break;
      case 'SHIPPED':
        subject = `Ваш заказ #${orderId.substring(0, 8)} отправлен`;
        statusMessage = trackingNumber 
          ? `Ваш заказ отправлен! Отслеживайте вашу посылку по номеру: ${trackingNumber}.`
          : 'Ваш заказ отправлен! Он уже в пути к вам.';
        break;
      case 'DELIVERED':
        subject = `Ваш заказ #${orderId.substring(0, 8)} доставлен`;
        statusMessage = 'Ваш заказ доставлен. Надеемся, вам понравится ваша покупка!';
        break;
      case 'CANCELLED':
        subject = `Ваш заказ #${orderId.substring(0, 8)} отменен`;
        statusMessage = 'Ваш заказ был отменен. Если у вас есть вопросы, пожалуйста, свяжитесь с нашей службой поддержки.';
        break;
      default:
        subject = `Обновление статуса заказа #${orderId.substring(0, 8)}`;
        statusMessage = `Статус вашего заказа обновлен: ${status}`;
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333; text-align: center;">Обновление заказа</h1>
        <p>Здравствуйте, ${name}!</p>
        <p>${statusMessage}</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h2 style="margin-top: 0;">Заказ #${orderId.substring(0, 8)}</h2>
          <p><strong>Статус:</strong> ${status}</p>
          ${trackingNumber ? `<p><strong>Номер отслеживания:</strong> ${trackingNumber}</p>` : ''}
        </div>
        
        <p>Спасибо за покупку!</p>
        <p>Команда ${SENDER_NAME}</p>
      </div>
    `;

    return await sendEmail(email, subject, emailHtml);
  } catch (error) {
    console.error('Failed to send shipping update email:', error);
    return { success: false, error };
  }
}

/**
 * Отправка тестового письма
 */
export async function sendTestEmail(email: string, name: string) {
  try {
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333; text-align: center;">Тестовое письмо</h1>
        <p>Здравствуйте, ${name}!</p>
        <p>Это тестовое письмо от интернет-магазина. Если вы получили это письмо, значит система отправки писем работает корректно.</p>
        <p>Команда ${SENDER_NAME}</p>
      </div>
    `;

    return await sendEmail(email, 'Тестовое письмо', emailHtml);
  } catch (error) {
    console.error('Failed to send test email:', error);
    return { success: false, error };
  }
}

/**
 * Отправка письма для сброса пароля
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetToken: string
) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333; text-align: center;">Сброс пароля</h1>
        <p>Здравствуйте, ${name}!</p>
        <p>Вы получили это письмо, потому что запросили сброс пароля. Нажмите на кнопку ниже для установки нового пароля:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
            Сбросить пароль
          </a>
        </div>
        
        <p>Если вы не запрашивали сброс пароля, проигнорируйте это письмо.</p>
        <p>Ссылка действительна в течение 1 часа.</p>
        
        <p>С уважением,<br>Команда ${SENDER_NAME}</p>
      </div>
    `;

    return await sendEmail(email, 'Сброс пароля на сайте', emailHtml);
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return { success: false, error };
  }
} 