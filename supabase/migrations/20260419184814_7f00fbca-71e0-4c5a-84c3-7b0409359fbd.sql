-- 1) Promote all existing subscriptions to 'pro' and ensure active status
UPDATE public.subscriptions
SET 
  plan = 'pro',
  status = 'active',
  expires_at = CASE 
    WHEN expires_at IS NULL OR expires_at < (NOW() + INTERVAL '4 months')
      THEN NOW() + INTERVAL '4 months'
    ELSE expires_at
  END,
  blocked_at = NULL,
  block_reason = NULL,
  is_soft_deleted = false;

-- 2) Update handle_new_user trigger function: new users get 'pro' plan automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name) 
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  INSERT INTO public.subscriptions (user_id, plan, status, expires_at) 
    VALUES (NEW.id, 'pro', 'active', NOW() + INTERVAL '4 months');
  INSERT INTO public.user_roles (user_id, role) 
    VALUES (NEW.id, 'atendente') 
    ON CONFLICT (user_id, role) DO NOTHING;
  INSERT INTO public.onboarding_status (user_id) 
    VALUES (NEW.id) 
    ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;