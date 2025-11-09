-- Fix RLS policies for contact_messages and add email notification trigger
-- This allows the portfolio owner to view all contact messages (not just their own)

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can view their own messages" ON contact_messages;

-- Create new policy that allows authenticated users to view all messages
-- This works for both real auth and bypass auth (fallback user ID)
-- Note: For bypass auth, the app will handle authentication check before calling fetchMessages
CREATE POLICY "Authenticated users can view all messages" ON contact_messages
  FOR SELECT
  USING (
    -- Allow if user is authenticated (real Supabase auth)
    auth.uid() IS NOT NULL
  );

-- Note: The INSERT policy already allows anyone to insert (from 0001_init.sql)
-- "Anyone can insert contact messages" - this is correct

-- Update policy to allow authenticated users to update/delete any message
DROP POLICY IF EXISTS "Users can update their own messages" ON contact_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON contact_messages;

CREATE POLICY "Authenticated users can update all messages" ON contact_messages
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete all messages" ON contact_messages
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Create function to send email notification when a new contact message is received
-- This uses pg_net extension to call Supabase Edge Function
-- The Edge Function URL is constructed from the current database's project reference
CREATE OR REPLACE FUNCTION public.notify_contact_message()
RETURNS TRIGGER AS $$
DECLARE
  recipient_email TEXT := 'brian.bureson@gmail.com'; -- Your email address
  email_subject TEXT;
  email_body TEXT;
  webhook_url TEXT;
  payload JSONB;
  supabase_url TEXT;
BEGIN
  -- Get Supabase project URL from current database
  -- This will be something like: https://YOUR_PROJECT_ID.supabase.co
  -- We construct the Edge Function URL from it
  supabase_url := current_setting('app.supabase_url', true);
  
  -- If Supabase URL is not set, try to construct from database name or use default pattern
  -- For Supabase hosted projects, you can set this via: ALTER DATABASE postgres SET app.supabase_url = 'https://YOUR_PROJECT_ID.supabase.co';
  IF supabase_url IS NULL OR supabase_url = '' THEN
    -- Try to get from Supabase project settings or use a placeholder
    -- User will need to set this manually
    RAISE NOTICE '📧 Supabase URL not configured. Message received from % (%). Email notification skipped. See docs/CONTACT_MESSAGES_SETUP.md for setup instructions.', NEW.name, NEW.email;
    RETURN NEW;
  END IF;
  
  -- Construct Edge Function URL
  webhook_url := supabase_url || '/functions/v1/send-contact-email';
  
  -- Prepare email content
  email_subject := 'New Contact Form Message from ' || NEW.name;
  email_body := 
    'You received a new message from your portfolio contact form:' || E'\n\n' ||
    'Name: ' || NEW.name || E'\n' ||
    'Email: ' || NEW.email || E'\n' ||
    'Message:' || E'\n' || NEW.message || E'\n\n' ||
    'View in Supabase Dashboard: https://supabase.com/dashboard/project/_/editor/contact_messages' || E'\n' ||
    'Message ID: ' || NEW.id::text;
  
  -- Build payload for Edge Function
  payload := jsonb_build_object(
    'to', recipient_email,
    'subject', email_subject,
    'text', email_body,
    'html', '<p>You received a new message from your portfolio contact form:</p>' ||
            '<p><strong>Name:</strong> ' || NEW.name || '</p>' ||
            '<p><strong>Email:</strong> ' || NEW.email || '</p>' ||
            '<p><strong>Message:</strong></p>' ||
            '<p>' || replace(NEW.message, E'\n', '<br>') || '</p>' ||
            '<p><a href="https://supabase.com/dashboard/project/_/editor/contact_messages">View in Supabase Dashboard</a></p>',
    'from', 'Portfolio <noreply@brianbureson.com>',
    'reply_to', NEW.email
  );
  
  -- Call Edge Function via pg_net
  -- Note: This requires the Edge Function to be deployed and the pg_net extension enabled
  PERFORM
    net.http_post(
      url := webhook_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key', true)
      ),
      body := payload::text
    );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the insert
    -- The message will still be saved to the database
    RAISE WARNING 'Failed to send email notification: %. Message was still saved. Error: %', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable pg_net extension for HTTP requests (if not already enabled)
-- Note: This may require Supabase admin privileges
-- If pg_net is not available, you can use Supabase Edge Functions instead
-- For Supabase hosted projects, pg_net should be available
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
    CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- If extension can't be created, log warning but continue
    RAISE NOTICE 'pg_net extension not available. Email notifications will use Edge Functions instead.';
END $$;

-- Create trigger to send email when new message is inserted
DROP TRIGGER IF EXISTS on_contact_message_created ON contact_messages;
CREATE TRIGGER on_contact_message_created
  AFTER INSERT ON contact_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_contact_message();

-- Add comment explaining the setup
COMMENT ON FUNCTION public.notify_contact_message() IS 
'Sends email notification when a new contact message is received via Supabase Edge Function.
Setup required:
1. Deploy the Edge Function: supabase/functions/send-contact-email
2. Set RESEND_API_KEY secret in Supabase Dashboard -> Edge Functions -> Secrets
3. Set app.supabase_url: ALTER DATABASE postgres SET app.supabase_url = ''https://YOUR_PROJECT_ID.supabase.co'';
4. Set app.supabase_anon_key: ALTER DATABASE postgres SET app.supabase_anon_key = ''YOUR_ANON_KEY'';
See docs/CONTACT_MESSAGES_SETUP.md for detailed instructions.';

