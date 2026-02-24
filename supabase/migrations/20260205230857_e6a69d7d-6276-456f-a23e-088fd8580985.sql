-- Drop and recreate the function with renamed output columns to fix ambiguous reference
DROP FUNCTION IF EXISTS public.check_and_reset_usage(uuid);

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
  SELECT * INTO v_limits FROM public.usage_limits WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    -- Create if not exists
    INSERT INTO public.usage_limits (user_id) VALUES (p_user_id)
    RETURNING * INTO v_limits;
  END IF;
  
  v_needs_daily_reset := v_limits.reset_daily_at < v_today;
  v_needs_monthly_reset := v_limits.reset_monthly_at < v_current_month;
  
  -- Reset if needed
  IF v_needs_daily_reset OR v_needs_monthly_reset THEN
    UPDATE public.usage_limits
    SET 
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