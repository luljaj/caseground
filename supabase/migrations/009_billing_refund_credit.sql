-- Refund credit usage when AI request fails
CREATE OR REPLACE FUNCTION public.refund_credit(p_user_id uuid, p_was_subscription boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
BEGIN
  IF p_was_subscription THEN
    UPDATE public.users
    SET monthly_usage_count = GREATEST(0, monthly_usage_count - 1)
    WHERE id = p_user_id;
  ELSE
    UPDATE public.users
    SET ai_credits = ai_credits + 1
    WHERE id = p_user_id;

    INSERT INTO public.credit_transactions (user_id, amount, reason)
    VALUES (p_user_id, 1, 'refund');
  END IF;
END;
$func$;
