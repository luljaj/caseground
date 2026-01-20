-- Add credits after successful purchase (idempotent per checkout session)
CREATE OR REPLACE FUNCTION public.add_credits(
  p_user_id uuid,
  p_amount integer,
  p_session_id text,
  p_payment_intent_id text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
BEGIN
  -- Idempotency: check if credits already added for this session
  IF EXISTS (
    SELECT 1 FROM public.credit_transactions
    WHERE stripe_checkout_session_id = p_session_id
  ) THEN
    RETURN; -- Already processed
  END IF;

  UPDATE public.users
  SET ai_credits = ai_credits + p_amount
  WHERE id = p_user_id;

  INSERT INTO public.credit_transactions (user_id, amount, reason, stripe_checkout_session_id, stripe_payment_intent_id)
  VALUES (p_user_id, p_amount, 'purchase', p_session_id, p_payment_intent_id);
END;
$func$;
