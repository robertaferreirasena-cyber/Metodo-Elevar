-- Recreate the function with new columns
CREATE FUNCTION public.get_all_subscriptions()
RETURNS TABLE(
  id uuid, 
  user_id uuid, 
  plan text, 
  status text, 
  started_at timestamp with time zone, 
  expires_at timestamp with time zone, 
  kiwify_order_id text, 
  payment_source text, 
  email text, 
  full_name text,
  blocked_at timestamp with time zone,
  block_reason text,
  is_soft_deleted boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    s.id,
    s.user_id,
    s.plan,
    s.status,
    s.started_at,
    s.expires_at,
    s.kiwify_order_id,
    s.payment_source,
    p.email,
    p.full_name,
    s.blocked_at,
    s.block_reason,
    COALESCE(s.is_soft_deleted, false)
  FROM public.subscriptions s
  JOIN public.profiles p ON p.id = s.user_id
  WHERE public.is_admin(auth.uid())
$$;

-- Create table for user tags
CREATE TABLE IF NOT EXISTS public.user_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create junction table for user-tag relationship
CREATE TABLE IF NOT EXISTS public.user_tag_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.user_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, tag_id)
);

-- Create table for user feature permissions
CREATE TABLE IF NOT EXISTS public.user_feature_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  -- Module access
  module_private BOOLEAN DEFAULT true,
  module_group BOOLEAN DEFAULT true,
  module_sequences BOOLEAN DEFAULT true,
  module_community BOOLEAN DEFAULT true,
  module_favorites BOOLEAN DEFAULT true,
  module_history BOOLEAN DEFAULT true,
  module_persona BOOLEAN DEFAULT true,
  module_ideas BOOLEAN DEFAULT true,
  module_photoboss BOOLEAN DEFAULT true,
  module_conversation_analysis BOOLEAN DEFAULT true,
  -- Custom limits (null means use default plan limits)
  custom_daily_limit INTEGER,
  custom_monthly_limit INTEGER,
  custom_persona_limit INTEGER,
  custom_sequence_limit INTEGER,
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.user_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_feature_permissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_tags
CREATE POLICY "Admins can manage tags" ON public.user_tags
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Authenticated users can view tags" ON public.user_tags
  FOR SELECT USING (true);

-- RLS policies for user_tag_assignments
CREATE POLICY "Admins can manage tag assignments" ON public.user_tag_assignments
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view own tags" ON public.user_tag_assignments
  FOR SELECT USING (auth.uid() = user_id);

-- RLS policies for user_feature_permissions
CREATE POLICY "Admins can manage permissions" ON public.user_feature_permissions
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view own permissions" ON public.user_feature_permissions
  FOR SELECT USING (auth.uid() = user_id);

-- Admin policies for subscriptions
CREATE POLICY "Admins can update any subscription" ON public.subscriptions
  FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete subscriptions" ON public.subscriptions
  FOR DELETE USING (public.is_admin(auth.uid()));

-- Create default tags
INSERT INTO public.user_tags (name, color) VALUES 
  ('Cliente Antigo', '#22c55e'),
  ('VIP', '#eab308'),
  ('Parceiro', '#3b82f6'),
  ('Teste', '#8b5cf6'),
  ('Suporte Prioritário', '#ef4444')
ON CONFLICT (name) DO NOTHING;

-- Create trigger to auto-update updated_at on user_feature_permissions
CREATE OR REPLACE FUNCTION public.update_user_feature_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_user_feature_permissions_timestamp
  BEFORE UPDATE ON public.user_feature_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_feature_permissions_updated_at();