-- Create linked_emails table for associating purchase emails with user accounts
CREATE TABLE public.linked_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  purchase_email TEXT NOT NULL,
  linked_by UUID NOT NULL,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  CONSTRAINT linked_emails_purchase_email_key UNIQUE(purchase_email),
  CONSTRAINT linked_emails_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT linked_emails_linked_by_fkey FOREIGN KEY (linked_by) REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Create index for faster lookups by user_id
CREATE INDEX idx_linked_emails_user_id ON public.linked_emails(user_id);

-- Create index for faster lookups by purchase_email
CREATE INDEX idx_linked_emails_purchase_email ON public.linked_emails(purchase_email);

-- Enable Row Level Security
ALTER TABLE public.linked_emails ENABLE ROW LEVEL SECURITY;

-- Admins can manage all linked emails
CREATE POLICY "Admins can manage linked emails"
ON public.linked_emails FOR ALL
USING (is_admin(auth.uid()));

-- Users can view their own linked emails
CREATE POLICY "Users can view own linked emails"
ON public.linked_emails FOR SELECT
USING (auth.uid() = user_id);