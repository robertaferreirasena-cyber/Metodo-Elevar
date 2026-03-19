ALTER TABLE public.user_feature_permissions
ADD COLUMN IF NOT EXISTS module_manychat_flows boolean DEFAULT true;