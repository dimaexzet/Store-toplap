import formData from 'form-data';
import Mailgun from 'mailgun.js';
import { formatCurrency } from '@/lib/utils';

const SENDER_EMAIL = process.env.SENDER_EMAIL || 'order@amazona.shop';
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || 'mg.yourdomain.com';

// Инициализация Mailgun
const mailgun = new Mailgun(formData);
const mg = process.env.MAILGUN_API_KEY 
  ? mailgun.client({ username: 'api', key: process.env.MAILGUN_API_KEY })
  : null;

/**
 * Sends an order confirmation email to the customer
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
    // Skip sending if Mailgun client wasn't initialized
    if (!mg) {
      console.warn('Email sending skipped - Mailgun API key is missing');
      return { success: false, error: 'API key not configured' };
    }
    
    // Format the order items as HTML
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
      
    // Calculate subtotals
    const itemsTotal = orderItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
    const shippingFee = total * 0.05; // Assuming 5% of total for shipping
    const tax = total * 0.1; // Assuming 10% tax

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333; text-align: center;">Order Confirmation</h1>
        <p>Hello ${name},</p>
        <p>Thank you for your order! We're processing it now and will let you know when it ships.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h2 style="margin-top: 0;">Order #${orderId.substring(0, 8)}</h2>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Payment Method:</strong> STRIPE</p>
          <p><strong>Shipping Address:</strong><br>
            ${name}<br>
            ${shippingAddress.street}<br>
            ${shippingAddress.city}, ${shippingAddress.state} ${
      shippingAddress.postalCode
    }<br>
            ${shippingAddress.country}
          </p>
        </div>
        
        <h3>Order Items</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th style="padding: 10px; text-align: left;">Image</th>
              <th style="padding: 10px; text-align: left;">Product</th>
              <th style="padding: 10px; text-align: left;">Quantity</th>
              <th style="padding: 10px; text-align: left;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${orderItemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="padding: 10px; text-align: right;"><strong>Subtotal:</strong></td>
              <td style="padding: 10px;">${formatCurrency(
                itemsTotal
              )}</td>
            </tr>
            <tr>
              <td colspan="3" style="padding: 10px; text-align: right;"><strong>Shipping:</strong></td>
              <td style="padding: 10px;">${formatCurrency(
                shippingFee
              )}</td>
            </tr>
            <tr>
              <td colspan="3" style="padding: 10px; text-align: right;"><strong>Tax:</strong></td>
              <td style="padding: 10px;">${formatCurrency(tax)}</td>
            </tr>
            <tr>
              <td colspan="3" style="padding: 10px; text-align: right;"><strong>Total:</strong></td>
              <td style="padding: 10px; font-weight: bold;">${formatCurrency(
                total
              )}</td>
            </tr>
          </tfoot>
        </table>
        
        <p>If you have any questions, please contact our customer service.</p>
        <p>Thank you for shopping with us!</p>
        <p>The Amazona Team</p>
      </div>
    `;

    const data = await mg.messages.create(MAILGUN_DOMAIN, {
      from: SENDER_EMAIL,
      to: email,
      subject: `Order Confirmation #${orderId.substring(0, 8)}`,
      html: emailHtml
    });

    return { success: true, data };
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
    return { success: false, error };
  }
}

/**
 * Sends a shipping update email to the customer
 */
export async function sendShippingUpdateEmail(
  email: string,
  name: string,
  orderId: string,
  status: string,
  trackingNumber?: string
) {
  try {
    // Skip sending if Mailgun client wasn't initialized
    if (!mg) {
      console.warn('Email sending skipped - Mailgun API key is missing');
      return { success: false, error: 'API key not configured' };
    }

    // Customize message based on status
    let statusMessage = '';
    let subject = '';

    switch (status) {
      case 'PROCESSING':
        subject = `Your Order #${orderId.substring(0, 8)} is Being Processed`;
        statusMessage = 'Your order is now being processed and will be shipped soon.';
        break;
      case 'SHIPPED':
        subject = `Your Order #${orderId.substring(0, 8)} Has Shipped`;
        statusMessage = trackingNumber 
          ? `Your order has been shipped! Track your package with tracking number: ${trackingNumber}.`
          : 'Your order has been shipped! It\'s on the way to you.';
        break;
      case 'DELIVERED':
        subject = `Your Order #${orderId.substring(0, 8)} Has Been Delivered`;
        statusMessage = 'Your order has been delivered. We hope you enjoy your purchase!';
        break;
      case 'CANCELLED':
        subject = `Your Order #${orderId.substring(0, 8)} Has Been Cancelled`;
        statusMessage = 'Your order has been cancelled. If you have any questions, please contact our customer support.';
        break;
      default:
        subject = `Update on Your Order #${orderId.substring(0, 8)}`;
        statusMessage = `Your order status has been updated to: ${status}`;
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333; text-align: center;">Order Update</h1>
        <p>Hello ${name},</p>
        <p>${statusMessage}</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h2 style="margin-top: 0;">Order #${orderId.substring(0, 8)}</h2>
          <p><strong>Status:</strong> ${status}</p>
          ${trackingNumber ? `<p><strong>Tracking Number:</strong> ${trackingNumber}</p>` : ''}
        </div>
        
        <p>Thank you for shopping with us!</p>
        <p>The Amazona Team</p>
      </div>
    `;

    const data = await mg.messages.create(MAILGUN_DOMAIN, {
      from: SENDER_EMAIL,
      to: email,
      subject: subject,
      html: emailHtml
    });

    return { success: true, data };
  } catch (error) {
    console.error('Failed to send shipping update email:', error);
    return { success: false, error };
  }
}

/**
 * Sends a password reset email to the user
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetToken: string
) {
  try {
    // Skip sending if Mailgun client wasn't initialized
    if (!mg) {
      console.warn('Email sending skipped - Mailgun API key is missing');
      return { success: false, error: 'API key not configured' };
    }
    
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333; text-align: center;">Password Reset</h1>
        <p>Hello ${name},</p>
        <p>We received a request to reset your password. Click the button below to reset it:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #f0c14b; color: #111; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
        </div>
        
        <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
        <p>This link is valid for 1 hour.</p>
        <p>The Amazona Team</p>
      </div>
    `;

    const data = await mg.messages.create(MAILGUN_DOMAIN, {
      from: SENDER_EMAIL,
      to: email,
      subject: 'Reset Your Password',
      html: emailHtml
    });

    return { success: true, data };
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return { success: false, error };
  }
} 