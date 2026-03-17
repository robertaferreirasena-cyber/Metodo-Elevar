-- 1. Update handle_new_user to set expires_at = 4 months from registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name) VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  INSERT INTO public.subscriptions (user_id, plan, status, expires_at) VALUES (NEW.id, 'free', 'active', NOW() + INTERVAL '4 months');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'atendente') ON CONFLICT (user_id, role) DO NOTHING;
  INSERT INTO public.onboarding_status (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;

-- 2. Update existing subscriptions without expires_at
UPDATE public.subscriptions
SET expires_at = started_at + INTERVAL '4 months'
WHERE expires_at IS NULL AND status = 'active';

-- 3. Create agent_knowledge_base table
CREATE TABLE IF NOT EXISTS public.agent_knowledge_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_key text UNIQUE NOT NULL,
  agent_name text NOT NULL,
  system_prompt text NOT NULL,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.agent_knowledge_base ENABLE ROW LEVEL SECURITY;

-- Admins can manage knowledge base
CREATE POLICY "Admins can manage knowledge base"
ON public.agent_knowledge_base
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- All authenticated users can read (for edge functions via service role, but also for display)
CREATE POLICY "Authenticated can read knowledge base"
ON public.agent_knowledge_base
FOR SELECT
TO authenticated
USING (true);