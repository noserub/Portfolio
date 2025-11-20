// Supabase Edge Function to send email notifications for contact form messages
// This function is called by the database trigger when a new contact message is received
// Uses SMTP directly (no third-party service required)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { SMTPClient } from "https://deno.land/x/denomailer/mod.ts"

// SMTP configuration from environment variables
const SMTP_HOST = Deno.env.get('SMTP_HOST') || 'smtp.gmail.com'
const SMTP_PORT = parseInt(Deno.env.get('SMTP_PORT') || '465')
const SMTP_USER = Deno.env.get('SMTP_USER')
const SMTP_PASSWORD = Deno.env.get('SMTP_PASSWORD')
const SMTP_FROM_EMAIL = Deno.env.get('SMTP_FROM_EMAIL') || 'brian.bureson@gmail.com'

// Helper function to send email via SMTP
async function sendEmailViaSMTP(
  to: string,
  subject: string,
  text: string,
  html: string,
  from: string,
  replyTo?: string
): Promise<void> {
  if (!SMTP_USER || !SMTP_PASSWORD) {
    throw new Error('SMTP credentials not configured. Please set SMTP_USER and SMTP_PASSWORD in Supabase Dashboard -> Edge Functions -> Secrets')
  }

  const client = new SMTPClient({
    connection: {
      hostname: SMTP_HOST,
      port: SMTP_PORT,
      tls: true,
      auth: {
        username: SMTP_USER,
        password: SMTP_PASSWORD,
      },
    },
  })

  try {
    await client.send({
      from: from,
      to: to,
      subject: subject,
      content: text,
      html: html,
      replyTo: replyTo,
    })
  } finally {
    await client.close()
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    const { to, subject, text, html, from, reply_to } = await req.json()

    if (!to || !subject) {
      throw new Error('Missing required fields: to and subject are required')
    }

    // Use provided from address or default
    const fromEmail = from || SMTP_FROM_EMAIL
    const emailText = text || ''
    const emailHtml = html || text?.replace(/\n/g, '<br>') || ''

    // Send email via SMTP
    await sendEmailViaSMTP(
      to,
      subject,
      emailText,
      emailHtml,
      fromEmail,
      reply_to
    )

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully via SMTP'
      }),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    )
  } catch (error) {
    console.error('Error sending email:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to send email',
        details: error.toString()
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    )
  }
})
