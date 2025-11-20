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

The database trigger automatically sends email notifications when new messages arrive. The system uses SMTP to send emails directly from your Gmail account (no third-party service subscription required).

### Setup Instructions

1. **Enable Two-Factor Authentication (2FA) on your Gmail account**
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable Two-Factor Authentication if you haven't already
   - This is required to generate an App Password

2. **Create a Gmail App Password**
   - In your Google Account Security settings, find "App Passwords"
   - Select "Mail" as the app and "Other" as the device
   - Name it (e.g., "Supabase Edge Function")
   - Click "Generate" to get your 16-character App Password
   - **Important:** Copy this password immediately - you won't be able to see it again

3. **Deploy the Edge Function**
   - The Edge Function code is already in `supabase/functions/send-contact-email/index.ts`
   - Deploy it using Supabase CLI:
     ```bash
     supabase functions deploy send-contact-email
     ```
   - Or deploy via Supabase Dashboard → Edge Functions → Deploy

4. **Configure SMTP Secrets in Supabase**
   - In Supabase Dashboard, go to **Settings** → **Edge Functions** → **Secrets**
   - Add the following secrets:
     - `SMTP_HOST` = `smtp.gmail.com`
     - `SMTP_PORT` = `465` (or `587` for STARTTLS)
     - `SMTP_USER` = Your Gmail address (e.g., `brian.bureson@gmail.com`)
     - `SMTP_PASSWORD` = The 16-character App Password you generated
     - `SMTP_FROM_EMAIL` = Your Gmail address (e.g., `brian.bureson@gmail.com`)

5. **Configure database settings**
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

### How It Works

- When a contact form is submitted, the message is saved to the `contact_messages` table
- A database trigger automatically calls the `send-contact-email` Edge Function
- The Edge Function uses SMTP to send an email notification to `brian.bureson@gmail.com`
- No third-party email service subscription is required - it uses your existing Gmail account

### Using Other Email Providers

You can use any email provider that supports SMTP:
- **Gmail** (current setup) - `smtp.gmail.com:465`
- **Outlook/Hotmail** - `smtp-mail.outlook.com:587`
- **Yahoo** - `smtp.mail.yahoo.com:587`
- **Custom SMTP server** - Use your own SMTP server settings

Just update the `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, and `SMTP_PASSWORD` secrets accordingly.

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
- Verify all SMTP secrets are set correctly (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`)
- Make sure you're using a Gmail App Password (not your regular Gmail password)
- Verify 2FA is enabled on your Gmail account
- Check that the database settings (`app.supabase_url` and `app.supabase_anon_key`) are configured
- Test the Edge Function directly from Supabase Dashboard → Edge Functions → Invoke

### Can't view messages in app
- Make sure you're signed in (either real auth or bypass auth)
- The RLS policy requires authentication to view messages

## Next Steps

After setting up email notifications:
1. Test with a real message submission
2. Verify you receive emails
3. Consider building a messages management UI in your app (future enhancement)

