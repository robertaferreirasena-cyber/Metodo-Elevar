
CREATE TABLE public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID REFERENCES public.whatsapp_instances(id) ON DELETE CASCADE,
  message_id TEXT,
  from_number TEXT NOT NULL,
  to_number TEXT,
  body TEXT,
  message_type TEXT DEFAULT 'text',
  media_url TEXT,
  is_from_me BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'received',
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage whatsapp_messages"
  ON public.whatsapp_messages FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE INDEX idx_whatsapp_messages_instance ON public.whatsapp_messages(instance_id);
CREATE INDEX idx_whatsapp_messages_created ON public.whatsapp_messages(created_at DESC);
