
-- Fix increment_usage: ensure caller can only increment their own usage
CREATE OR REPLACE FUNCTION public.increment_usage(p_user_id uuid, p_function_type text DEFAULT 'general'::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: cannot modify another user usage';
  END IF;

  UPDATE public.usage_limits SET
    daily_requests = daily_requests + 1,
    monthly_requests = monthly_requests + 1,
    persona_requests_month = CASE WHEN p_function_type = 'persona' THEN persona_requests_month + 1 ELSE persona_requests_month END,
    sequence_requests_month = CASE WHEN p_function_type = 'sequence' THEN sequence_requests_month + 1 ELSE sequence_requests_month END,
    last_request_at = NOW()
  WHERE user_id = p_user_id;
  RETURN FOUND;
END;
$function$;

-- Fix track_token_usage: ensure caller can only track their own tokens
CREATE OR REPLACE FUNCTION public.track_token_usage(p_user_id uuid, p_feature text, p_tokens integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_current_feature_tokens integer;
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: cannot modify another user token usage';
  END IF;

  SELECT COALESCE((tokens_by_feature->>p_feature)::integer, 0) INTO v_current_feature_tokens FROM usage_limits WHERE user_id = p_user_id;
  UPDATE usage_limits SET
    tokens_used_daily = tokens_used_daily + p_tokens,
    tokens_used_monthly = tokens_used_monthly + p_tokens,
    tokens_by_feature = jsonb_set(COALESCE(tokens_by_feature, '{}'::jsonb), ARRAY[p_feature], to_jsonb(v_current_feature_tokens + p_tokens))
  WHERE user_id = p_user_id;
END;
$function$;

-- Fix check_and_reset_usage: ensure caller can only check/reset their own usage
CREATE OR REPLACE FUNCTION public.check_and_reset_usage(p_user_id uuid)
 RETURNS TABLE(out_daily_requests integer, out_monthly_requests integer, out_persona_requests_month integer, out_sequence_requests_month integer, out_needs_daily_reset boolean, out_needs_monthly_reset boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_limits RECORD;
  v_today DATE := CURRENT_DATE;
  v_current_month DATE := DATE_TRUNC('month', CURRENT_DATE)::DATE;
  v_needs_daily_reset boolean;
  v_needs_monthly_reset boolean;
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: cannot access another user usage data';
  END IF;

  SELECT * INTO v_limits FROM public.usage_limits WHERE user_id = p_user_id;
  IF NOT FOUND THEN
    INSERT INTO public.usage_limits (user_id) VALUES (p_user_id) RETURNING * INTO v_limits;
  END IF;
  v_needs_daily_reset := v_limits.reset_daily_at < v_today;
  v_needs_monthly_reset := v_limits.reset_monthly_at < v_current_month;
  IF v_needs_daily_reset OR v_needs_monthly_reset THEN
    UPDATE public.usage_limits SET
      daily_requests = CASE WHEN v_needs_daily_reset THEN 0 ELSE usage_limits.daily_requests END,
      monthly_requests = CASE WHEN v_needs_monthly_reset THEN 0 ELSE usage_limits.monthly_requests END,
      persona_requests_month = CASE WHEN v_needs_monthly_reset THEN 0 ELSE usage_limits.persona_requests_month END,
      sequence_requests_month = CASE WHEN v_needs_monthly_reset THEN 0 ELSE usage_limits.sequence_requests_month END,
      tokens_used_daily = CASE WHEN v_needs_daily_reset THEN 0 ELSE usage_limits.tokens_used_daily END,
      tokens_used_monthly = CASE WHEN v_needs_monthly_reset THEN 0 ELSE usage_limits.tokens_used_monthly END,
      tokens_by_feature = CASE WHEN v_needs_monthly_reset THEN '{}'::jsonb ELSE usage_limits.tokens_by_feature END,
      reset_daily_at = CASE WHEN v_needs_daily_reset THEN v_today ELSE usage_limits.reset_daily_at END,
      reset_monthly_at = CASE WHEN v_needs_monthly_reset THEN v_current_month ELSE usage_limits.reset_monthly_at END
    WHERE user_id = p_user_id
    RETURNING usage_limits.daily_requests, usage_limits.monthly_requests, usage_limits.persona_requests_month, usage_limits.sequence_requests_month
    INTO out_daily_requests, out_monthly_requests, out_persona_requests_month, out_sequence_requests_month;
  ELSE
    out_daily_requests := v_limits.daily_requests;
    out_monthly_requests := v_limits.monthly_requests;
    out_persona_requests_month := v_limits.persona_requests_month;
    out_sequence_requests_month := v_limits.sequence_requests_month;
  END IF;
  out_needs_daily_reset := v_needs_daily_reset;
  out_needs_monthly_reset := v_needs_monthly_reset;
  RETURN NEXT;
END;
$function$;

-- Fix get_token_stats: restrict to admins only
CREATE OR REPLACE FUNCTION public.get_token_stats()
 RETURNS TABLE(total_tokens_used bigint, total_requests bigint, active_users bigint, avg_tokens_per_user numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(SUM(tokens_used_monthly), 0)::bigint, COALESCE(SUM(monthly_requests), 0)::bigint, COUNT(DISTINCT user_id)::bigint,
    CASE WHEN COUNT(DISTINCT user_id) > 0 THEN ROUND(COALESCE(SUM(tokens_used_monthly), 0)::numeric / COUNT(DISTINCT user_id), 0) ELSE 0 END
  FROM usage_limits WHERE monthly_requests > 0 AND public.is_admin(auth.uid())
$function$;

-- Fix get_tokens_by_feature: restrict to admins only
CREATE OR REPLACE FUNCTION public.get_tokens_by_feature()
 RETURNS TABLE(feature text, tokens bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT key as feature, COALESCE(SUM(value::numeric), 0)::bigint as tokens
  FROM usage_limits, jsonb_each_text(tokens_by_feature) 
  WHERE public.is_admin(auth.uid())
  GROUP BY key ORDER BY tokens DESC
$function$;
