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

When someone submits the contact form, the app:

1. Saves the message to Supabase (`contact_messages`)
2. Calls `/api/send-contact-email` (Vercel serverless function) to email you via [Resend](https://resend.com)

### Setup (Vercel + Resend)

1. **Sign up for Resend**
   - Go to [resend.com](https://resend.com)
   - Create a free account (100 emails/day free tier)

2. **Verify your sending domain**
   - In Resend, add and verify `bureson.com` (DNS records)
   - The default sender is `Portfolio <noreply@bureson.com>`

3. **Create a Resend API key**
   - Resend dashboard → API Keys → Create
   - Copy the key

4. **Add environment variables in Vercel**
   - Project → Settings → Environment Variables
   - `RESEND_API_KEY` = your Resend API key (Production + Preview)
   - Optional: `CONTACT_NOTIFY_TO` = inbox for submissions (defaults to `VITE_SITE_OWNER_SIGNIN_EMAIL` or `brian.bureson@gmail.com`)
   - Optional: `CONTACT_FROM_EMAIL` = verified sender (defaults to `Portfolio <noreply@bureson.com>`)

5. **Local dev**
   - Add the same vars to `.env.local` (not committed)
   - `npm run dev` serves `/api/send-contact-email` via a Vite dev middleware

6. **Redeploy** after adding env vars

### Legacy: Supabase database trigger (optional)

Migration `0023` includes an optional DB trigger + Edge Function path. The Vercel API route above is the supported setup for this site; you do not need to configure `app.supabase_url` unless you prefer the trigger approach.

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

