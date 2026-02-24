ALTER TABLE public.whatsapp_instances
ADD COLUMN webhook_url TEXT,
ADD COLUMN webhook_enabled BOOLEAN DEFAULT false;