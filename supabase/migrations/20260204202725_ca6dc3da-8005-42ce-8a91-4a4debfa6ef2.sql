-- Add token tracking columns to usage_limits
ALTER TABLE public.usage_limits 
ADD COLUMN IF NOT EXISTS tokens_used_daily integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS tokens_used_monthly integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS tokens_by_feature jsonb DEFAULT '{}'::jsonb;

-- Create function to track token usage by feature
CREATE OR REPLACE FUNCTION public.track_token_usage(
  p_user_id uuid,
  p_feature text,
  p_tokens integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_feature_tokens integer;
BEGIN
  -- Get current tokens for this feature
  SELECT COALESCE((tokens_by_feature->>p_feature)::integer, 0)
  INTO v_current_feature_tokens
  FROM usage_limits
  WHERE user_id = p_user_id;

  -- Update the usage_limits with new token counts
  UPDATE usage_limits
  SET 
    tokens_used_daily = tokens_used_daily + p_tokens,
    tokens_used_monthly = tokens_used_monthly + p_tokens,
    tokens_by_feature = jsonb_set(
      COALESCE(tokens_by_feature, '{}'::jsonb),
      ARRAY[p_feature],
      to_jsonb(v_current_feature_tokens + p_tokens)
    )
  WHERE user_id = p_user_id;
END;
$$;

-- Create function to get aggregated token stats for admin (simplified)
CREATE OR REPLACE FUNCTION public.get_token_stats()
RETURNS TABLE(
  total_tokens_used bigint,
  total_requests bigint,
  active_users bigint,
  avg_tokens_per_user numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(SUM(tokens_used_monthly), 0)::bigint as total_tokens_used,
    COALESCE(SUM(monthly_requests), 0)::bigint as total_requests,
    COUNT(DISTINCT user_id)::bigint as active_users,
    CASE 
      WHEN COUNT(DISTINCT user_id) > 0 
      THEN ROUND(COALESCE(SUM(tokens_used_monthly), 0)::numeric / COUNT(DISTINCT user_id), 0)
      ELSE 0
    END as avg_tokens_per_user
  FROM usage_limits
  WHERE monthly_requests > 0
$$;

-- Create function to get tokens by feature aggregated
CREATE OR REPLACE FUNCTION public.get_tokens_by_feature()
RETURNS TABLE(feature text, tokens bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    key as feature,
    COALESCE(SUM(value::numeric), 0)::bigint as tokens
  FROM usage_limits, jsonb_each_text(tokens_by_feature)
  GROUP BY key
  ORDER BY tokens DESC
$$;

-- Create admin policy to view all usage_limits
CREATE POLICY "Admins can view all usage limits"
ON public.usage_limits
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));