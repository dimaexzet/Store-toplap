import nodemailer from 'nodemailer';
import { Resend } from 'resend';

// SMTP Configuration
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.eu.mailgun.org';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || 'email@mail.toplap.store';
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || '123456789';
const SENDER_NAME = process.env.SENDER_NAME || 'Toplap';
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'mail@toplap.store';
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'info@toplap.store';

// Create SMTP transporter
let transporter: nodemailer.Transporter | null = null;
try {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD,
    },
    // Add longer timeout for Vercel
    connectionTimeout: 30000, // 30 seconds
    greetingTimeout: 30000,
    socketTimeout: 30000,
  });
  console.log('SMTP transport initialized');
} catch (error) {
  console.error('Failed to create SMTP transporter:', error);
}

// Initialize Resend if API key is available
let resend: Resend | null = null;
if (process.env.RESEND_API_KEY) {
  try {
    resend = new Resend(process.env.RESEND_API_KEY);
    console.log('Resend client initialized');
  } catch (error) {
    console.error('Failed to initialize Resend:', error);
  }
}

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
  console.log(`Sending contact form from ${email} with subject: ${subject}`);

  const htmlContent = `
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
  `;

  // First try Resend if available
  if (resend) {
    try {
      console.log('Attempting to send via Resend API...');
      const result = await resend.emails.send({
        from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
        to: CONTACT_EMAIL,
        replyTo: email,
        subject: `Contact Form: ${subject}`,
        html: htmlContent,
      });
      
      console.log('Message sent via Resend:', result);
      return { success: true, data: result, provider: 'resend' };
    } catch (error) {
      console.error('Failed to send via Resend, falling back to SMTP:', error);
      // Fall back to SMTP
    }
  }

  // If Resend failed or is not available, try SMTP
  if (transporter) {
    try {
      console.log('Attempting to send via SMTP...', {
        from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
        to: CONTACT_EMAIL,
        subject: `Contact Form: ${subject}`,
        smtp: {
          host: SMTP_HOST,
          port: SMTP_PORT,
          user: SMTP_USER
        }
      });
      
      // Skip sending if SMTP not configured
      if (!SMTP_PASSWORD) {
        console.warn('Email sending skipped - SMTP password is missing');
        return { success: false, error: 'SMTP password not configured', provider: 'smtp' };
      }

      const mailOptions = {
        from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
        to: CONTACT_EMAIL,
        replyTo: email,
        subject: `Contact Form: ${subject}`,
        html: htmlContent,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Message sent via SMTP: %s', info.messageId);
      
      return { success: true, data: info, provider: 'smtp' };
    } catch (error) {
      console.error('Failed to send contact form email via SMTP:', error);
      const errorDetails = error instanceof Error ? 
        { message: error.message, stack: error.stack } : 
        String(error);
      
      return { success: false, error: errorDetails, provider: 'smtp' };
    }
  }

  // If neither method is available
  console.error('No email provider configured (neither Resend nor SMTP)');
  return {
    success: false,
    error: 'No email provider configured',
    provider: 'none',
  };
}

/**
 * Test SMTP connection
 */
export async function testSmtpConnection() {
  try {
    if (!transporter) {
      console.error('SMTP transporter is not initialized');
      return { success: false, error: 'SMTP configuration not available' };
    }
    
    console.log('Testing SMTP connection with:', { 
      host: SMTP_HOST, 
      port: SMTP_PORT, 
      user: SMTP_USER,
      password: SMTP_PASSWORD ? '(password masked)' : '(not set)' 
    });
    
    // Verify SMTP connection
    const verified = await transporter.verify();
    
    if (verified) {
      console.log('SMTP connection verified successfully');
      return { success: true, message: 'SMTP connection verified successfully' };
    } else {
      console.error('SMTP connection verification failed without specific error');
      return { success: false, error: 'SMTP connection verification failed' };
    }
  } catch (error) {
    console.error('SMTP connection test failed:', error);
    const errorMessage = error instanceof Error ? 
      { message: error.message, stack: error.stack } : 
      String(error);
    
    return { success: false, error: errorMessage };
  }
}

/**
 * Send test email
 */
export async function sendTestEmail(email: string, name: string) {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333; text-align: center;">Test Email</h1>
      <p>Hello ${name},</p>
      <p>This is a test email to verify that the email system is working correctly.</p>
      <p>If you received this email, the email configuration is correct.</p>
      <p>Regards,<br>${SENDER_NAME} Team</p>
    </div>
  `;

  // First try Resend if available
  if (resend) {
    try {
      console.log('Attempting to send test email via Resend API...');
      const result = await resend.emails.send({
        from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
        to: email,
        subject: 'Test Email from Toplap Store',
        html: htmlContent,
      });
      
      console.log('Test message sent via Resend:', result);
      return { success: true, data: result, provider: 'resend' };
    } catch (error) {
      console.error('Failed to send test email via Resend, falling back to SMTP:', error);
      // Fall back to SMTP
    }
  }

  // If Resend failed or is not available, try SMTP
  if (transporter) {
    try {
      console.log('Attempting to send test email via SMTP...');
      if (!SMTP_PASSWORD) {
        console.warn('Test email sending skipped - SMTP password is missing');
        return { success: false, error: 'SMTP password not configured', provider: 'smtp' };
      }

      const mailOptions = {
        from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
        to: email,
        subject: 'Test Email from Toplap Store',
        html: htmlContent,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Test message sent via SMTP: %s', info.messageId);
      
      return { success: true, data: info, provider: 'smtp' };
    } catch (error) {
      console.error('Failed to send test email via SMTP:', error);
      return { success: false, error, provider: 'smtp' };
    }
  }

  // If neither method is available
  return {
    success: false,
    error: 'No email provider configured',
    provider: 'none',
  };
}