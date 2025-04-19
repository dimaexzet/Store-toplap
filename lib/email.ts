import nodemailer from 'nodemailer';

// SMTP Configuration
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.eu.mailgun.org';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || 'email@mail.toplap.store';
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || '123456789';
const SENDER_NAME = process.env.SENDER_NAME || 'Toplap';
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'mail@toplap.store';
const CONTACT_EMAIL = 'info@toplap.store';

// Create transporter
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASSWORD,
  },
});

/**
 * Send contact form email
 */
export async function sendContactFormEmail(
  name: string,
  email: string,
  phone: string,
  subject: string,
  message: string
) {
  try {
    // Skip sending if SMTP not configured
    if (!SMTP_PASSWORD) {
      console.warn('Email sending skipped - SMTP password is missing');
      return { success: false, error: 'SMTP password not configured' };
    }

    const mailOptions = {
      from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
      to: CONTACT_EMAIL,
      replyTo: email,
      subject: `Contact Form: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">New Contact Form Submission</h1>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h2 style="margin-top: 0;">Contact Details</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
            <p><strong>Subject:</strong> ${subject}</p>
          </div>
          
          <div style="margin: 20px 0;">
            <h2>Message:</h2>
            <p style="white-space: pre-line;">${message}</p>
          </div>
          
          <p style="color: #666; font-size: 12px;">This message was sent from the contact form on toplap.store</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
    
    return { success: true, data: info };
  } catch (error) {
    console.error('Failed to send contact form email:', error);
    return { success: false, error };
  }
}

/**
 * Test SMTP connection
 */
export async function testSmtpConnection() {
  try {
    // Verify SMTP connection
    const verified = await transporter.verify();
    
    if (verified) {
      return { success: true, message: 'SMTP connection verified successfully' };
    } else {
      return { success: false, error: 'SMTP connection verification failed' };
    }
  } catch (error) {
    console.error('SMTP connection test failed:', error);
    return { success: false, error };
  }
}

/**
 * Send test email
 */
export async function sendTestEmail(email: string, name: string) {
  try {
    if (!SMTP_PASSWORD) {
      console.warn('Email sending skipped - SMTP password is missing');
      return { success: false, error: 'SMTP password not configured' };
    }

    const mailOptions = {
      from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
      to: email,
      subject: 'Test Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; text-align: center;">Test Email</h1>
          <p>Hello ${name},</p>
          <p>This is a test email to verify that the email system is working correctly.</p>
          <p>If you received this email, the SMTP configuration is correct.</p>
          <p>Regards,<br>${SENDER_NAME} Team</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Test message sent: %s', info.messageId);
    
    return { success: true, data: info };
  } catch (error) {
    console.error('Failed to send test email:', error);
    return { success: false, error };
  }
}