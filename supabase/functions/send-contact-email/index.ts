// Supabase Edge Function to send email notifications for contact form messages
// This function is called by the database trigger when a new contact message is received

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const DEFAULT_FROM_EMAIL = 'Portfolio <noreply@brianbureson.com>'

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

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured. Please set it in Supabase Dashboard -> Edge Functions -> Secrets')
    }

    if (!to || !subject) {
      throw new Error('Missing required fields: to and subject are required')
    }

    // Send email via Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: from || DEFAULT_FROM_EMAIL,
        to: [to],
        subject: subject,
        text: text || '',
        html: html || text?.replace(/\n/g, '<br>') || '',
        reply_to: reply_to,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || `Resend API error: ${response.statusText}`)
    }

    return new Response(
      JSON.stringify({ success: true, data }),
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

