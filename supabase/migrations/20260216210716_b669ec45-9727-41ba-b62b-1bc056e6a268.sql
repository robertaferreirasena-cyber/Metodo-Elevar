
-- =============================================
-- CRM COMPLETO - Tabelas, RLS e Seed
-- =============================================

-- 1. crm_contacts
CREATE TABLE public.crm_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  company text,
  source text DEFAULT 'outro',
  notes text,
  tags text[] DEFAULT '{}',
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on crm_contacts" ON public.crm_contacts
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE TRIGGER update_crm_contacts_updated_at
  BEFORE UPDATE ON public.crm_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. crm_pipeline_stages
CREATE TABLE public.crm_pipeline_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL DEFAULT '#6366f1',
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_pipeline_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on crm_pipeline_stages" ON public.crm_pipeline_stages
  FOR ALL USING (public.is_admin(auth.uid()));

-- Seed default stages
INSERT INTO public.crm_pipeline_stages (name, color, position) VALUES
  ('Novo Lead', '#3b82f6', 0),
  ('Contato Feito', '#8b5cf6', 1),
  ('Em Negociação', '#f59e0b', 2),
  ('Proposta Enviada', '#f97316', 3),
  ('Fechado Ganho', '#22c55e', 4),
  ('Fechado Perdido', '#ef4444', 5);

-- 3. crm_deals
CREATE TABLE public.crm_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  stage_id uuid NOT NULL REFERENCES public.crm_pipeline_stages(id),
  title text NOT NULL,
  value numeric DEFAULT 0,
  expected_close_date date,
  status text NOT NULL DEFAULT 'open',
  lost_reason text,
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on crm_deals" ON public.crm_deals
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE TRIGGER update_crm_deals_updated_at
  BEFORE UPDATE ON public.crm_deals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. crm_activities
CREATE TABLE public.crm_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  deal_id uuid REFERENCES public.crm_deals(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'note',
  title text NOT NULL,
  description text,
  due_date timestamptz,
  completed_at timestamptz,
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on crm_activities" ON public.crm_activities
  FOR ALL USING (public.is_admin(auth.uid()));
