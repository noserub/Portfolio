-- Add is_archived column to contact_messages table
ALTER TABLE contact_messages 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_contact_messages_archived ON contact_messages(is_archived);

