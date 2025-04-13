import { Resend } from 'resend';

// Initialize Resend with API key from environment variable
const resend = new Resend(process.env.RESEND_API_KEY);

// Set the sender email address
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'orders@amazona.com';

/**
 * Send an order confirmation email
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
    // Format order items for email
    const itemsList = orderItems.map(item => 
      `<tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.product.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">$${Number(item.price).toFixed(2)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">$${(Number(item.price) * item.quantity).toFixed(2)}</td>
      </tr>`
    ).join('');

    // Format shipping address
    const address = `
      ${shippingAddress.street}<br>
      ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postalCode}<br>
      ${shippingAddress.country}
    `;

    const { data, error } = await resend.emails.send({
      from: SENDER_EMAIL,
      to: email,
      subject: `Order Confirmation #${orderId.substring(0, 8)}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; text-align: center;">Order Confirmation</h1>
          <p>Hello ${name},</p>
          <p>Thank you for your order! We're processing it right away.</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h2 style="margin-top: 0;">Order #${orderId.substring(0, 8)}</h2>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            
            <h3>Items</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f2f2f2;">
                  <th style="padding: 10px; text-align: left;">Product</th>
                  <th style="padding: 10px; text-align: left;">Price</th>
                  <th style="padding: 10px; text-align: left;">Quantity</th>
                  <th style="padding: 10px; text-align: left;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsList}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" style="padding: 10px; text-align: right;"><strong>Order Total:</strong></td>
                  <td style="padding: 10px;"><strong>$${Number(total).toFixed(2)}</strong></td>
                </tr>
              </tfoot>
            </table>
            
            <h3>Shipping Address</h3>
            <p>${address}</p>
          </div>
          
          <p>You'll receive another email when your order ships.</p>
          <p>Thank you for shopping with us!</p>
          <p>The Amazona Team</p>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending order confirmation email:', error);
      throw new Error(`Failed to send order confirmation email: ${error.message}`);
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Error in sendOrderConfirmationEmail:', error);
    return { success: false, error };
  }
}

/**
 * Send an order status update email
 */
export async function sendShippingUpdateEmail(
  email: string,
  name: string,
  orderId: string,
  status: string,
  trackingNumber?: string
) {
  try {
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

    const { data, error } = await resend.emails.send({
      from: SENDER_EMAIL,
      to: email,
      subject,
      html: `
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
      `,
    });

    if (error) {
      console.error('Error sending shipping update email:', error);
      throw new Error(`Failed to send shipping update email: ${error.message}`);
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Error in sendShippingUpdateEmail:', error);
    return { success: false, error };
  }
}

/**
 * Send a password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetLink: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: SENDER_EMAIL,
      to: email,
      subject: 'Reset Your Password - Amazona',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; text-align: center;">Password Reset Request</h1>
          <p>Hello,</p>
          <p>We received a request to reset your password for your Amazona account. Click the button below to set a new password:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
          </div>
          
          <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
          <p>This link will expire in 1 hour.</p>
          
          <p>Thank you,</p>
          <p>The Amazona Team</p>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending password reset email:', error);
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Error in sendPasswordResetEmail:', error);
    return { success: false, error };
  }
} 