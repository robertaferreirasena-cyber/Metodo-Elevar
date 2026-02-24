-- Create usage_limits table for tracking and limiting user requests
CREATE TABLE public.usage_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  daily_requests INTEGER NOT NULL DEFAULT 0,
  monthly_requests INTEGER NOT NULL DEFAULT 0,
  persona_requests_month INTEGER NOT NULL DEFAULT 0,
  sequence_requests_month INTEGER NOT NULL DEFAULT 0,
  last_request_at TIMESTAMPTZ,
  reset_daily_at DATE NOT NULL DEFAULT CURRENT_DATE,
  reset_monthly_at DATE NOT NULL DEFAULT DATE_TRUNC('month', CURRENT_DATE)::DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.usage_limits ENABLE ROW LEVEL SECURITY;

-- Users can only view their own usage limits
CREATE POLICY "Users can view own usage limits"
ON public.usage_limits
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own usage limits (for incrementing counters)
CREATE POLICY "Users can update own usage limits"
ON public.usage_limits
FOR UPDATE
USING (auth.uid() = user_id);

-- Service role can insert (created by trigger or edge function)
CREATE POLICY "Service can insert usage limits"
ON public.usage_limits
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create function to initialize usage_limits when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user_usage_limits()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usage_limits (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-create usage_limits for new profiles
CREATE TRIGGER on_profile_created_usage_limits
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_usage_limits();

-- Create function to check and reset daily/monthly counters
CREATE OR REPLACE FUNCTION public.check_and_reset_usage(p_user_id UUID)
RETURNS TABLE(
  daily_requests INTEGER,
  monthly_requests INTEGER,
  persona_requests_month INTEGER,
  sequence_requests_month INTEGER,
  needs_daily_reset BOOLEAN,
  needs_monthly_reset BOOLEAN
) AS $$
DECLARE
  v_limits RECORD;
  v_today DATE := CURRENT_DATE;
  v_current_month DATE := DATE_TRUNC('month', CURRENT_DATE)::DATE;
BEGIN
  SELECT * INTO v_limits FROM public.usage_limits WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    -- Create if not exists
    INSERT INTO public.usage_limits (user_id) VALUES (p_user_id)
    RETURNING * INTO v_limits;
  END IF;
  
  needs_daily_reset := v_limits.reset_daily_at < v_today;
  needs_monthly_reset := v_limits.reset_monthly_at < v_current_month;
  
  -- Reset if needed
  IF needs_daily_reset OR needs_monthly_reset THEN
    UPDATE public.usage_limits
    SET 
      daily_requests = CASE WHEN needs_daily_reset THEN 0 ELSE daily_requests END,
      monthly_requests = CASE WHEN needs_monthly_reset THEN 0 ELSE monthly_requests END,
      persona_requests_month = CASE WHEN needs_monthly_reset THEN 0 ELSE persona_requests_month END,
      sequence_requests_month = CASE WHEN needs_monthly_reset THEN 0 ELSE sequence_requests_month END,
      reset_daily_at = CASE WHEN needs_daily_reset THEN v_today ELSE reset_daily_at END,
      reset_monthly_at = CASE WHEN needs_monthly_reset THEN v_current_month ELSE reset_monthly_at END
    WHERE user_id = p_user_id
    RETURNING daily_requests, monthly_requests, persona_requests_month, sequence_requests_month
    INTO daily_requests, monthly_requests, persona_requests_month, sequence_requests_month;
  ELSE
    daily_requests := v_limits.daily_requests;
    monthly_requests := v_limits.monthly_requests;
    persona_requests_month := v_limits.persona_requests_month;
    sequence_requests_month := v_limits.sequence_requests_month;
  END IF;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to increment usage
CREATE OR REPLACE FUNCTION public.increment_usage(
  p_user_id UUID,
  p_function_type TEXT DEFAULT 'general'
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.usage_limits
  SET 
    daily_requests = daily_requests + 1,
    monthly_requests = monthly_requests + 1,
    persona_requests_month = CASE WHEN p_function_type = 'persona' THEN persona_requests_month + 1 ELSE persona_requests_month END,
    sequence_requests_month = CASE WHEN p_function_type = 'sequence' THEN sequence_requests_month + 1 ELSE sequence_requests_month END,
    last_request_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;