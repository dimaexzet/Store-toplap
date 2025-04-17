import { NextResponse } from 'next/server'

// Environment variables
const MAILGUN_TESTMODE = process.env.MAILGUN_TESTMODE === 'true'

export async function GET() {
  return NextResponse.json({
    testMode: MAILGUN_TESTMODE,
    smtpHost: process.env.SMTP_HOST || 'smtp.eu.mailgun.org', 
    mailgunDomain: process.env.MAILGUN_DOMAIN || 'sandbox domain'
  })
} 