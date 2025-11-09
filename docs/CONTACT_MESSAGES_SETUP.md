# Contact Messages Setup Guide

## Overview

Contact form messages are stored in the `contact_messages` table in Supabase. This guide explains how to:
1. View messages in Supabase Dashboard
2. Set up email notifications when new messages arrive

## Where Messages Are Stored

**Table:** `contact_messages` in Supabase

**Fields:**
- `id` - Unique message ID
- `created_at` - Timestamp when message was sent
- `name` - Sender's name
- `email` - Sender's email address
- `message` - Message content
- `is_read` - Whether you've read the message (default: false)
- `user_id` - Linked to sender's profile if they were logged in (usually null for anonymous visitors)

## Viewing Messages

### Option 1: Supabase Dashboard (Recommended)
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Table Editor** → `contact_messages`
4. You'll see all messages sorted by `created_at` (newest first)

### Option 2: Via Your App (Coming Soon)
A messages management UI will be added to your app in edit mode.

## Email Notifications Setup

The database trigger automatically sends email notifications when new messages arrive. You need to configure an email service.

### Option A: Using Resend (Recommended - Easy Setup)

1. **Sign up for Resend**
   - Go to [resend.com](https://resend.com)
   - Create a free account (100 emails/day free tier)

2. **Get your API key**
   - Go to API Keys in Resend dashboard
   - Create a new API key
   - Copy the key

3. **Set up Supabase Edge Function**
   - In Supabase Dashboard, go to **Edge Functions**
   - Create a new function called `send-contact-email`
   - Use the code from `supabase/functions/send-contact-email/index.ts` (see below)
   - Set the `RESEND_API_KEY` secret in Supabase Dashboard → Settings → Edge Functions → Secrets

4. **Configure database settings**
   - In Supabase Dashboard, go to **SQL Editor**
   - Run these SQL commands (replace with your actual values):
   ```sql
   -- Set your Supabase project URL
   ALTER DATABASE postgres SET app.supabase_url = 'https://YOUR_PROJECT_ID.supabase.co';
   
   -- Set your anon key (found in Settings -> API)
   ALTER DATABASE postgres SET app.supabase_anon_key = 'YOUR_ANON_KEY_HERE';
   ```
   - Replace `YOUR_PROJECT_ID` with your actual Supabase project ID
   - Replace `YOUR_ANON_KEY_HERE` with your Supabase anon key (found in Settings → API)

### Option B: Using Supabase Edge Functions with Resend

Create a Supabase Edge Function that handles email sending:

**File:** `supabase/functions/send-contact-email/index.ts`
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  try {
    const { to, subject, text, html, from, reply_to } = await req.json()

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: from || 'Portfolio <noreply@brianbureson.com>',
        to: [to],
        subject: subject,
        text: text,
        html: html,
        reply_to: reply_to,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send email')
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

### Option C: Using Other Email Services

You can use any email service that provides an HTTP API:
- **SendGrid** - Similar setup to Resend
- **Mailgun** - Another popular option
- **AWS SES** - If you're using AWS
- **Postmark** - Great deliverability

Just update the webhook URL and API key configuration.

## Testing Email Notifications

1. Submit a test message through your contact form
2. Check your email inbox (brian.bureson@gmail.com)
3. Check Supabase Dashboard → Edge Functions → Logs for any errors

## Troubleshooting

### Messages not appearing in Supabase Dashboard
- Make sure you're authenticated in Supabase Dashboard
- Check that the RLS policy allows viewing (should be fixed by migration 0023)

### Email notifications not working
- Check Supabase Dashboard → Edge Functions → Logs for errors
- Verify the webhook URL is set correctly
- Verify the API key is set in Supabase secrets
- Check that the email service (Resend, etc.) is configured correctly

### Can't view messages in app
- Make sure you're signed in (either real auth or bypass auth)
- The RLS policy requires authentication to view messages

## Next Steps

After setting up email notifications:
1. Test with a real message submission
2. Verify you receive emails
3. Consider building a messages management UI in your app (future enhancement)

