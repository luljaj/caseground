-- Atomic credit deduction with rate limiting and subscription support
CREATE OR REPLACE FUNCTION public.deduct_credit_atomic(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_user record;
  v_rate_limit_seconds integer;
  v_seconds_since_last integer;
  v_has_access boolean;
BEGIN
  -- Row-level lock to prevent race conditions
  SELECT ai_credits, stripe_subscription_status, monthly_usage_count,
         monthly_usage_reset_at, last_ai_request_at
  INTO v_user
  FROM public.users
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'user_not_found');
  END IF;

  -- Check if user has subscription access
  v_has_access := has_subscription_access(v_user.stripe_subscription_status);

  -- Rate limit: 5s for subscribers (including past_due during grace period), 20s for credit users
  v_rate_limit_seconds := CASE WHEN v_has_access THEN 5 ELSE 20 END;

  IF v_user.last_ai_request_at IS NOT NULL THEN
    v_seconds_since_last := EXTRACT(EPOCH FROM (now() - v_user.last_ai_request_at))::integer;
    IF v_seconds_since_last < v_rate_limit_seconds THEN
      RETURN jsonb_build_object(
        'success', false,
        'reason', 'rate_limited',
        'retry_after', v_rate_limit_seconds - v_seconds_since_last
      );
    END IF;
  END IF;

  -- Check if subscriber with access
  IF v_has_access THEN
    -- Reset monthly counter if new month
    IF v_user.monthly_usage_reset_at IS NULL OR
       v_user.monthly_usage_reset_at < date_trunc('month', now()) THEN
      UPDATE public.users
      SET monthly_usage_count = 1,
          monthly_usage_reset_at = now(),
          last_ai_request_at = now()
      WHERE id = p_user_id;

      RETURN jsonb_build_object(
        'success', true,
        'is_subscription', true,
        'monthly_usage', 1
      );
    END IF;

    -- Check anti-abuse cap (1000/month)
    IF v_user.monthly_usage_count >= 1000 THEN
      RETURN jsonb_build_object('success', false, 'reason', 'monthly_limit_exceeded');
    END IF;

    -- Increment usage
    UPDATE public.users
    SET monthly_usage_count = monthly_usage_count + 1,
        last_ai_request_at = now()
    WHERE id = p_user_id;

    RETURN jsonb_build_object(
      'success', true,
      'is_subscription', true,
      'monthly_usage', v_user.monthly_usage_count + 1
    );
  ELSE
    -- Credit user: check and deduct
    IF v_user.ai_credits <= 0 THEN
      RETURN jsonb_build_object(
        'success', false,
        'reason', 'no_credits',
        'credits_remaining', 0
      );
    END IF;

    UPDATE public.users
    SET ai_credits = ai_credits - 1,
        last_ai_request_at = now()
    WHERE id = p_user_id;

    -- Log transaction
    INSERT INTO public.credit_transactions (user_id, amount, reason)
    VALUES (p_user_id, -1, 'ai_request');

    RETURN jsonb_build_object(
      'success', true,
      'is_subscription', false,
      'credits_remaining', v_user.ai_credits - 1
    );
  END IF;
END;
$func$;
