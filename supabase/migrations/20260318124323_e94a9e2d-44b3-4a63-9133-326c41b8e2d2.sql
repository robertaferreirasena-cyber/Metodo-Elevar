
-- 1. Remove policy that lets users update their own subscription (privilege escalation)
DROP POLICY IF EXISTS "Users can update own subscription" ON public.subscriptions;

-- 2. Remove policy that lets users insert usage limits with arbitrary values
DROP POLICY IF EXISTS "Service can insert usage limits" ON public.usage_limits;
