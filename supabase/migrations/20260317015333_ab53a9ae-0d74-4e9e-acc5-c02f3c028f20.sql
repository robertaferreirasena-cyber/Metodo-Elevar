
-- Create onboarding_status table
CREATE TABLE public.onboarding_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  current_step integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.onboarding_status ENABLE ROW LEVEL SECURITY;

-- Users can view own onboarding status
CREATE POLICY "Users can view own onboarding" ON public.onboarding_status
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Users can insert own onboarding status
CREATE POLICY "Users can insert own onboarding" ON public.onboarding_status
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Users can update own onboarding status
CREATE POLICY "Users can update own onboarding" ON public.onboarding_status
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Update handle_new_user to also create onboarding_status
CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name) VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  INSERT INTO public.subscriptions (user_id, plan, status) VALUES (NEW.id, 'free', 'active');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'atendente') ON CONFLICT (user_id, role) DO NOTHING;
  INSERT INTO public.onboarding_status (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;
