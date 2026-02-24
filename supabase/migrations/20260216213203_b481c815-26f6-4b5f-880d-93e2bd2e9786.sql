-- Table to store WhatsApp instances managed by admins
CREATE TABLE public.whatsapp_instances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  instance_token TEXT NOT NULL,
  phone TEXT,
  status TEXT DEFAULT 'disconnected',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;

-- Only admins can manage instances
CREATE POLICY "Admins full access" ON public.whatsapp_instances
  FOR ALL USING (public.is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_whatsapp_instances_updated_at
  BEFORE UPDATE ON public.whatsapp_instances
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();