
-- Add scheduling columns to sequence_posts
ALTER TABLE public.sequence_posts
ADD COLUMN scheduled_at timestamptz,
ADD COLUMN send_status text NOT NULL DEFAULT 'draft',
ADD COLUMN send_error text,
ADD COLUMN sent_at timestamptz;

-- Add webhook config columns to sequences
ALTER TABLE public.sequences
ADD COLUMN webhook_url text,
ADD COLUMN whatsapp_group_id text,
ADD COLUMN whatsapp_group_name text;

-- Add UPDATE RLS policy for sequence_posts
CREATE POLICY "Users can update posts from their sequences"
ON public.sequence_posts
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM sequences
  WHERE sequences.id = sequence_posts.sequence_id
  AND sequences.user_id = auth.uid()
));

-- Add UPDATE RLS policy for sequences
CREATE POLICY "Users can update their own sequences"
ON public.sequences
FOR UPDATE
USING (auth.uid() = user_id);

-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
