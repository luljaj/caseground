-- Billing schema additions for Stripe integration

-- Add billing columns to existing users table
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS stripe_customer_id text UNIQUE,
  -- Store raw Stripe subscription status (no CHECK constraint)
  -- Stripe statuses: 'incomplete', 'incomplete_expired', 'trialing', 'active',
  --                  'past_due', 'canceled', 'unpaid', 'paused'
  -- We add 'none' for users without a subscription
  ADD COLUMN IF NOT EXISTS stripe_subscription_status text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS subscription_id text,
  ADD COLUMN IF NOT EXISTS subscription_period_end timestamptz,
  -- Tracks if user has scheduled cancellation (cancel_at_period_end = true)
  ADD COLUMN IF NOT EXISTS subscription_cancel_at_period_end boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS monthly_usage_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_usage_reset_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_ai_request_at timestamptz;

-- Index for subscription queries
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer
  ON public.users(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_subscription_active
  ON public.users(stripe_subscription_status)
  WHERE stripe_subscription_status IN ('active', 'trialing');

-- Function to check if user has active subscription access
-- Grants access for: 'active', 'trialing', 'past_due' (grace period)
CREATE OR REPLACE FUNCTION public.has_subscription_access(p_status text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $func$
  SELECT p_status IN ('active', 'trialing', 'past_due')
$func$;

-- Credit transactions audit trail
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  amount integer NOT NULL, -- positive = add, negative = deduct
  reason text NOT NULL,    -- 'purchase', 'ai_request', 'refund', 'bonus'
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user
  ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_session
  ON public.credit_transactions(stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_credit_transactions_payment_intent
  ON public.credit_transactions(stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

-- RLS: Users can view own transactions
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions"
  ON public.credit_transactions FOR SELECT USING (auth.uid() = user_id);

-- Webhook events for idempotency (with retry support)
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id text PRIMARY KEY,  -- Stripe event ID
  event_type text NOT NULL,
  status text NOT NULL DEFAULT 'processing', -- 'processing', 'processed', 'failed'
  error_message text,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_status
  ON public.webhook_events(status) WHERE status != 'processed';
CREATE INDEX IF NOT EXISTS idx_webhook_events_created
  ON public.webhook_events(created_at);

-- Cleanup helper for webhook events (call via Edge Function or cron)
CREATE OR REPLACE FUNCTION public.cleanup_old_webhook_events()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.webhook_events
  WHERE processed_at < now() - interval '30 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN COALESCE(deleted_count, 0);
END;
$func$;

-- Function to safely set stripe_customer_id (bypasses RLS, prevents race conditions)
CREATE OR REPLACE FUNCTION public.set_stripe_customer_id(
  p_user_id uuid,
  p_customer_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_existing_customer_id text;
BEGIN
  -- Row-level lock prevents race condition where two requests both create customers
  SELECT stripe_customer_id INTO v_existing_customer_id
  FROM public.users
  WHERE id = p_user_id
  FOR UPDATE;

  -- If already set, return the existing customer ID
  IF v_existing_customer_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'customer_id', v_existing_customer_id,
      'was_existing', true
    );
  END IF;

  -- Set the new customer ID
  UPDATE public.users
  SET stripe_customer_id = p_customer_id
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'customer_id', p_customer_id,
    'was_existing', false
  );
END;
$func$;

