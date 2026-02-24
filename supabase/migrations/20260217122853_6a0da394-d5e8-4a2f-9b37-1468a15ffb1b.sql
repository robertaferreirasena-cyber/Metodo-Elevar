
-- Tabela de etiquetas de contato (temperatura do lead)
CREATE TABLE public.whatsapp_contact_tags (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  instance_id uuid NOT NULL REFERENCES whatsapp_instances(id) ON DELETE CASCADE,
  contact_phone text NOT NULL,
  tag text NOT NULL DEFAULT 'novo',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(instance_id, contact_phone)
);

ALTER TABLE public.whatsapp_contact_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage contact tags"
  ON public.whatsapp_contact_tags FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE TRIGGER update_whatsapp_contact_tags_updated_at
  BEFORE UPDATE ON public.whatsapp_contact_tags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tabela de alertas de follow-up
CREATE TABLE public.whatsapp_followup_alerts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  instance_id uuid NOT NULL REFERENCES whatsapp_instances(id) ON DELETE CASCADE,
  contact_phone text NOT NULL,
  contact_name text DEFAULT '',
  alert_type text NOT NULL DEFAULT 'no_response',
  alert_message text NOT NULL,
  suggested_action text DEFAULT '',
  priority text DEFAULT 'medium',
  is_read boolean DEFAULT false,
  is_dismissed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.whatsapp_followup_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage followup alerts"
  ON public.whatsapp_followup_alerts FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE TRIGGER update_whatsapp_followup_alerts_updated_at
  BEFORE UPDATE ON public.whatsapp_followup_alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_followup_alerts;
