# Billing & Monetization Implementation Plan

## Overview
Implement a monetization system for Caseground with credit packages and subscriptions using Stripe.

## Pricing Structure
| Product | Price | Display Price | Value |
|---------|-------|---------------|-------|
| 50 Credits | $5 | $5 | One-time |
| 110 Credits | $10 | $10 | One-time (100 + 10 bonus) |
| Unlimited Monthly | $4/month | **$3.99/month** | Anti-abuse cap only |

---

## Phase 1: Database Schema

**New migration: `007_billing_schema.sql`**

### Users Table Updates
Add columns to `public.users` (aligns with existing schema in `001_initial_schema.sql`):

```sql
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
```

> **Design decision:** Store raw Stripe status without CHECK constraint. This prevents webhook failures when Stripe adds new statuses. Access control logic uses a helper function to determine if user has active access.

### Access Control Helper
```sql
-- Function to check if user has active subscription access
-- Grants access for: 'active', 'trialing', 'past_due' (grace period)
CREATE OR REPLACE FUNCTION public.has_subscription_access(p_status text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT p_status IN ('active', 'trialing', 'past_due')
$$;
```

### New Tables
```sql
-- 1. Credit transactions audit trail
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

-- 2. Webhook events for idempotency (with retry support)
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
```

### Webhook Events Cleanup (Supabase Scheduled Function)

Create a Supabase Edge Function or use pg_cron to clean up old webhook events:

```sql
-- Option 1: If pg_cron extension is enabled
SELECT cron.schedule(
  'cleanup-webhook-events',
  '0 3 * * *', -- Run daily at 3 AM
  $$DELETE FROM public.webhook_events WHERE processed_at < now() - interval '30 days'$$
);

-- Option 2: Call this manually or via Edge Function scheduled trigger
CREATE OR REPLACE FUNCTION public.cleanup_old_webhook_events()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.webhook_events 
  WHERE processed_at < now() - interval '30 days'
  RETURNING count(*) INTO deleted_count;
  RETURN COALESCE(deleted_count, 0);
END;
$$;
```

### RLS-Bypassing RPC for Stripe Customer ID

Since RLS policies may block updates to sensitive columns like `stripe_customer_id`, use a SECURITY DEFINER function with row-level locking to prevent race conditions:

```sql
-- Function to safely set stripe_customer_id (bypasses RLS, prevents race conditions)
CREATE OR REPLACE FUNCTION public.set_stripe_customer_id(
  p_user_id uuid,
  p_customer_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;
```

### Database Functions

**Function 1: `deduct_credit_atomic(user_id uuid)`**

This replaces the current non-atomic credit check in `/api/feedback/route.ts` (lines 47-59 + 205-217):

```sql
CREATE OR REPLACE FUNCTION public.deduct_credit_atomic(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  -- Note: past_due users intentionally get subscriber rate limits during dunning grace period
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
$$;
```

**Function 2: `refund_credit(user_id uuid, was_subscription boolean)`**

```sql
CREATE OR REPLACE FUNCTION public.refund_credit(p_user_id uuid, p_was_subscription boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;
```

**Function 3: `add_credits(user_id, amount, session_id, payment_intent_id)`**

```sql
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
AS $$
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
$$;
```

---

## Phase 2: Stripe Setup

### Products & Prices (create in Stripe Dashboard)
1. **50 AI Credits** - $5.00 one-time, metadata: `{credits: "50"}`
2. **110 AI Credits** - $10.00 one-time, metadata: `{credits: "110"}`
3. **Unlimited Monthly** - $3.99/month recurring

### Environment Variables
Add to `.env.example` and `.env.local`:
```env
# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_CREDITS_50=price_...
STRIPE_PRICE_CREDITS_110=price_...
STRIPE_PRICE_UNLIMITED=price_...

# App URL (used for Stripe redirects)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Dependencies
```bash
npm install stripe
```

---

## Phase 3: API Routes

### 3.1 New Route: `/app/api/stripe/checkout/route.ts`

**Reuse patterns from:**
- Auth check pattern from `app/api/feedback/route.ts` lines 30-38
- Supabase client from `lib/supabase/server.ts`

```typescript
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

type ProductType = "credits_50" | "credits_110" | "unlimited";

const PRICE_MAP: Record<ProductType, string> = {
  credits_50: process.env.STRIPE_PRICE_CREDITS_50!,
  credits_110: process.env.STRIPE_PRICE_CREDITS_110!,
  unlimited: process.env.STRIPE_PRICE_UNLIMITED!,
};

export async function POST(request: Request) {
  // 1. Auth check (reuse exact pattern from feedback/route.ts:30-38)
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse product type
  const body = await request.json();
  const productType = body?.product as ProductType;

  if (!productType || !PRICE_MAP[productType]) {
    return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  }

  // 3. Get or create Stripe customer (with race condition handling)
  const { data: profile } = await supabase
    .from("users")
    .select("stripe_customer_id, email")
    .eq("id", user.id)
    .single();

  let customerId = profile?.stripe_customer_id;

  if (!customerId) {
    // Create Stripe customer
    const customer = await stripe.customers.create({
      email: user.email || profile?.email,
      metadata: { supabase_user_id: user.id },
    });

    // Use RPC with row-level locking to prevent race conditions
    // If another request already set a customer ID, use that one instead
    const { data: rpcResult } = await supabase.rpc("set_stripe_customer_id", {
      p_user_id: user.id,
      p_customer_id: customer.id,
    });

    if (rpcResult?.was_existing) {
      // Another request won the race - use existing customer ID
      // Optionally: delete the orphaned Stripe customer we just created
      // await stripe.customers.del(customer.id); // uncomment if you want cleanup
      customerId = rpcResult.customer_id;
    } else {
      customerId = customer.id;
    }
  }

  // 4. Create checkout session
  const isSubscription = productType === "unlimited";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  const sessionConfig: Stripe.Checkout.SessionCreateParams = {
    customer: customerId,
    // client_reference_id for reliable user identification even if metadata is missing
    client_reference_id: user.id,
    mode: isSubscription ? "subscription" : "payment",
    line_items: [{ price: PRICE_MAP[productType], quantity: 1 }],
    success_url: `${appUrl}/dashboard?checkout=success`,
    cancel_url: `${appUrl}/pricing?checkout=canceled`,
    metadata: { 
      supabase_user_id: user.id,
      product_type: productType,
    },
  };

  // For subscriptions, add metadata to subscription_data for downstream events
  if (isSubscription) {
    sessionConfig.subscription_data = {
      metadata: {
        supabase_user_id: user.id,
      },
    };
  }

  const session = await stripe.checkout.sessions.create(sessionConfig);

  return NextResponse.json({ url: session.url });
}
```

### 3.2 New Route: `/app/api/stripe/webhooks/route.ts`

**Key considerations:**
- **App Router**: Use `export const runtime = "nodejs"` (NOT Pages Router `config.api.bodyParser`)
- Uses `request.text()` for raw body signature verification
- Needs service role client for DB updates (bypasses RLS)
- Always retrieve subscription with expands for period data
- Check `payment_status === 'paid'` before granting credits
- Handle `checkout.session.async_payment_succeeded` for delayed payment methods
- **Idempotency**: Only mark event as processed AFTER success; return 500 on failure to allow Stripe retries
- Handle `customer.subscription.created` (for subscriptions created outside Checkout)

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

// Force Node.js runtime (required for App Router webhook signature verification)
export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Service role client for webhook (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CREDITS_MAP: Record<string, number> = {
  credits_50: 50,
  credits_110: 110,
};

// Helper: Get user ID from various sources
async function getUserId(
  session?: Stripe.Checkout.Session | null,
  customerId?: string | null
): Promise<string | null> {
  // Try session metadata first
  if (session?.metadata?.supabase_user_id) {
    return session.metadata.supabase_user_id;
  }
  // Try client_reference_id
  if (session?.client_reference_id) {
    return session.client_reference_id;
  }
  // Fallback to customer lookup
  if (customerId) {
    const { data } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .single();
    return data?.id ?? null;
  }
  return null;
}

// Helper: Get subscription period end from items (Stripe API 2025-03-31+)
function getSubscriptionPeriodEnd(subscription: Stripe.Subscription): number | null {
  // Newer API: period is on subscription items
  const itemPeriodEnd = subscription.items?.data?.[0]?.current_period_end;
  if (itemPeriodEnd) return itemPeriodEnd;
  
  // Fallback for older API versions (deprecated but may still work)
  return (subscription as any).current_period_end ?? null;
}

// Helper: Update subscription status in DB
async function updateSubscriptionStatus(
  userId: string,
  subscription: Stripe.Subscription
) {
  const periodEnd = getSubscriptionPeriodEnd(subscription);
  
  await supabaseAdmin
    .from("users")
    .update({
      stripe_subscription_status: subscription.status,
      subscription_id: subscription.id,
      subscription_period_end: periodEnd 
        ? new Date(periodEnd * 1000).toISOString() 
        : null,
      subscription_cancel_at_period_end: subscription.cancel_at_period_end ?? false,
    })
    .eq("id", userId);
}

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Idempotency check - but don't finalize until processing succeeds
  const { data: existing } = await supabaseAdmin
    .from("webhook_events")
    .select("id, status")
    .eq("id", event.id)
    .single();

  if (existing) {
    // Already processed successfully
    if (existing.status === "processed") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    // If it was 'processing' or 'failed', we'll retry it below
  } else {
    // Record event as 'processing' (not finalized yet)
    await supabaseAdmin
      .from("webhook_events")
      .insert({ id: event.id, event_type: event.type, status: "processing" });
  }

  try {
    switch (event.type) {
      // ============================================
      // CHECKOUT COMPLETED - Initial purchase/subscription
      // ============================================
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = await getUserId(session);
        const productType = session.metadata?.product_type;
        
        if (!userId) {
          // Mark as failed so we can investigate - don't silently skip
          throw new Error("checkout.session.completed: No user ID found in session metadata or client_reference_id");
        }

        // Update stripe_customer_id if not set
        if (session.customer) {
          await supabaseAdmin
            .from("users")
            .update({ stripe_customer_id: session.customer as string })
            .eq("id", userId);
        }

        if (productType === "unlimited") {
          // Subscription: always retrieve with expands to get period data
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string,
            { expand: ["items.data"] }
          );
          await updateSubscriptionStatus(userId, subscription);
        } else if (CREDITS_MAP[productType!]) {
          // Credit purchase: only grant if payment is complete
          // For async payment methods, wait for checkout.session.async_payment_succeeded
          if (session.payment_status === "paid") {
            const credits = CREDITS_MAP[productType!];
            await supabaseAdmin.rpc("add_credits", { 
              p_user_id: userId, 
              p_amount: credits,
              p_session_id: session.id,
              p_payment_intent_id: session.payment_intent as string | null,
            });
          }
          // If payment_status is 'unpaid' or 'no_payment_required', 
          // credits will be granted by async_payment_succeeded
        }
        break;
      }

      // ============================================
      // ASYNC PAYMENT SUCCEEDED - Delayed payment methods (bank transfers, etc.)
      // ============================================
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = await getUserId(session);
        const productType = session.metadata?.product_type;
        
        if (!userId || !productType) {
          throw new Error("async_payment_succeeded: Missing user ID or product type");
        }

        // Only handle credit purchases (subscriptions don't use async payments typically)
        if (CREDITS_MAP[productType]) {
          const credits = CREDITS_MAP[productType];
          await supabaseAdmin.rpc("add_credits", { 
            p_user_id: userId, 
            p_amount: credits,
            p_session_id: session.id,
            p_payment_intent_id: session.payment_intent as string | null,
          });
        }
        break;
      }

      // ============================================
      // ASYNC PAYMENT FAILED - Delayed payment method failed
      // ============================================
      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        // Log for monitoring - no credits were granted, so nothing to reverse
        // Optionally: send user an email notification
        console.warn(
          `Async payment failed for session ${session.id}, ` +
          `user: ${session.metadata?.supabase_user_id || session.client_reference_id}`
        );
        // Future: could trigger email notification here
        break;
      }

      // ============================================
      // SUBSCRIPTION CREATED - Subscription created (outside Checkout, portal, admin, etc.)
      // ============================================
      case "customer.subscription.created":
      // ============================================
      // SUBSCRIPTION UPDATED - Status changes, renewals scheduled, cancellations
      // ============================================
      case "customer.subscription.updated": {
        const subscriptionFromEvent = event.data.object as Stripe.Subscription;
        const customerId = subscriptionFromEvent.customer as string;

        // IMPORTANT: Webhook payloads don't expand items automatically
        // Always retrieve with expand to get period data
        const subscription = await stripe.subscriptions.retrieve(
          subscriptionFromEvent.id,
          { expand: ["items.data"] }
        );

        const { data: user } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (user) {
          await updateSubscriptionStatus(user.id, subscription);
        }
        break;
      }

      // ============================================
      // SUBSCRIPTION DELETED - Subscription fully ended
      // ============================================
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        await supabaseAdmin
          .from("users")
          .update({
            stripe_subscription_status: "canceled",
            subscription_id: null,
            subscription_period_end: null,
            subscription_cancel_at_period_end: false,
          })
          .eq("stripe_customer_id", customerId);
        break;
      }

      // ============================================
      // INVOICE PAID - Successful renewal payment
      // ============================================
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        
        // Only process subscription invoices (not one-time charges)
        if (!invoice.subscription) break;

        // Retrieve subscription with expands to get current status/period
        const subscription = await stripe.subscriptions.retrieve(
          invoice.subscription as string,
          { expand: ["items.data"] }
        );

        const { data: user } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (user) {
          // This flips status back to 'active' after successful payment
          // (important for recovering from past_due)
          await updateSubscriptionStatus(user.id, subscription);
        }
        break;
      }

      // ============================================
      // INVOICE PAYMENT FAILED - Dunning flow starts
      // ============================================
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Only mark past_due for subscription invoices
        if (!invoice.subscription) break;

        await supabaseAdmin
          .from("users")
          .update({ stripe_subscription_status: "past_due" })
          .eq("stripe_customer_id", customerId);
        break;
      }
    }

    // SUCCESS: Mark event as processed
    await supabaseAdmin
      .from("webhook_events")
      .update({ status: "processed", processed_at: new Date().toISOString() })
      .eq("id", event.id);

  } catch (err) {
    console.error(`Error processing webhook ${event.type}:`, err);
    
    // Mark as failed for debugging
    await supabaseAdmin
      .from("webhook_events")
      .update({ 
        status: "failed", 
        error_message: err instanceof Error ? err.message : "Unknown error" 
      })
      .eq("id", event.id);

    // Return 500 so Stripe will retry the webhook
    return NextResponse.json(
      { error: "Webhook processing failed" }, 
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
```

### 3.3 New Route: `/app/api/stripe/portal/route.ts`

```typescript
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ error: "No billing account" }, { status: 400 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  });

  return NextResponse.json({ url: session.url });
}
```

### 3.4 Modified: `/app/api/stats/route.ts`

**Minimal changes** - extend existing response with subscription info:

```typescript
// ADD to existing select query (line 17):
.select("ai_credits, stripe_subscription_status, subscription_period_end, subscription_cancel_at_period_end")

// ADD to return object (lines 71-75):
return NextResponse.json({
  totalAttempted,
  aiCredits: profile.ai_credits,
  byType,
  // NEW:
  subscription: {
    status: profile.stripe_subscription_status || 'none',
    periodEnd: profile.subscription_period_end || null,
    cancelAtPeriodEnd: profile.subscription_cancel_at_period_end || false,
  },
});
```

### 3.5 Modified: `/app/api/feedback/route.ts`

**Replace current check-then-deduct with atomic RPC call:**

Current problematic flow (lines 47-59 + 205-217):
```
1. Check credits → 2. Call AI → 3. Deduct credit
```

New atomic flow:
```typescript
// REPLACE lines 47-59 with:
const { data: deductResult, error: deductError } = await supabase
  .rpc("deduct_credit_atomic", { p_user_id: user.id });

if (deductError || !deductResult?.success) {
  const reason = deductResult?.reason || "deduction_failed";
  
  if (reason === "rate_limited") {
    return NextResponse.json({ 
      error: "Please wait before generating more feedback.",
      retry_after: deductResult.retry_after,
    }, { status: 429 });
  }
  
  if (reason === "no_credits") {
    return NextResponse.json({ 
      error: "No credits remaining.",
      credits_remaining: 0,
    }, { status: 400 });
  }

  if (reason === "monthly_limit_exceeded") {
    return NextResponse.json({ 
      error: "Monthly usage limit reached. Please try again next month.",
    }, { status: 400 });
  }

  return NextResponse.json({ error: "Unable to process request." }, { status: 500 });
}

const wasSubscription = deductResult.is_subscription;

// ... existing AI call code (lines 82-190) ...

// REPLACE lines 205-217 with:
// Credit already deducted atomically, just return result
return NextResponse.json({ 
  feedback: cleanedFeedback, 
  creditsRemaining: wasSubscription ? null : deductResult.credits_remaining,
});

// ADD after AI error handling (around line 180):
// If AI fails, refund the credit
if (!aiResponse.ok) {
  await supabase.rpc("refund_credit", { 
    p_user_id: user.id, 
    p_was_subscription: wasSubscription 
  });
  // ... existing error return ...
}
```

---

## Phase 4: Types Update

### Modified: `/types/index.ts`

Add to existing types (minimal additions):

```typescript
// After line 44 (User interface):
export interface User {
  id: string;
  email: string;
  username: string | null;
  ai_credits: number;
  created_at: string;
  // NEW billing fields:
  stripe_customer_id?: string | null;
  stripe_subscription_status: StripeSubscriptionStatus;
  subscription_period_end?: string | null;
  subscription_cancel_at_period_end?: boolean;
}

// NEW types at end of file:

// Raw Stripe subscription statuses
export type StripeSubscriptionStatus = 
  | 'none'              // No subscription (our addition)
  | 'incomplete'        // Initial payment pending
  | 'incomplete_expired'// Initial payment failed
  | 'trialing'          // In trial period
  | 'active'            // Active and paid
  | 'past_due'          // Payment failed, in dunning
  | 'canceled'          // Fully canceled
  | 'unpaid'            // Payment failed, subscription ended
  | 'paused';           // Manually paused

// Helper to check if status grants access
export function hasSubscriptionAccess(status: StripeSubscriptionStatus): boolean {
  return ['active', 'trialing', 'past_due'].includes(status);
}

export interface UserSubscription {
  status: StripeSubscriptionStatus;
  periodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export interface StatsPayload {
  totalAttempted: number;
  aiCredits: number;
  byType: {
    estimations: number;
    behaviorals: number;
    reasoning: number;
  };
  subscription: UserSubscription;
}

export type BillingProduct = 'credits_50' | 'credits_110' | 'unlimited';
```

---

## Phase 5: Frontend - Pricing Page

### New Page: `/app/pricing/page.tsx`

**Reuse patterns from:**
- Page structure from `app/dashboard/page.tsx`
- Button component from `components/ui/Button.tsx`
- Gradient card styling from `components/results/AIFeedback.tsx` (lines 54-60)

**Public page (no auth required for viewing):**

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { cn } from "@/lib/utils/cn";
import type { BillingProduct } from "@/types";

const PRODUCTS = [
  {
    id: "credits_50" as BillingProduct,
    name: "50 Credits",
    price: "$5",
    description: "One-time purchase",
    features: ["50 AI feedbacks", "Never expires", "Use anytime"],
  },
  {
    id: "credits_110" as BillingProduct,
    name: "110 Credits",
    price: "$10",
    description: "Best for power users",
    features: ["100 + 10 bonus credits", "Never expires", "Use anytime"],
  },
  {
    id: "unlimited" as BillingProduct,
    name: "Unlimited",
    price: "$3.99",
    priceDetail: "/month",
    isBestValue: true,
    description: "Unlimited AI feedback",
    features: ["Unlimited AI feedback", "Cancel anytime", "Priority support"],
  },
];

export default function PricingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<BillingProduct | null>(null);

  const handlePurchase = async (product: BillingProduct) => {
    if (!user) {
      router.push("/signin?next=/pricing");
      return;
    }

    setLoading(product);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product }),
      });
      const { url, error } = await response.json();
      if (url) {
        window.location.href = url;
      } else {
        console.error(error);
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      {/* Header - reuse dashboard header pattern */}
      <div className="text-center mb-12 animate-fade-up">
        <h1 className="text-3xl font-semibold text-text-primary">Pricing</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Get AI-powered feedback on your case interview responses
        </p>
      </div>

      {/* Pricing cards grid */}
      <div className="grid gap-6 md:grid-cols-3 animate-fade-up" style={{ animationDelay: "50ms" }}>
        {PRODUCTS.map((product) => (
          <div key={product.id} className="relative rounded-xl overflow-hidden">
            {/* Gradient border - reuse AIFeedback pattern */}
            <div className={cn(
              "absolute inset-0 rounded-xl",
              product.isBestValue
                ? "bg-gradient-to-br from-violet-500/40 via-blue-500/20 to-violet-600/40"
                : "bg-gradient-to-br from-zinc-600/30 via-zinc-700/15 to-zinc-800/30"
            )} />
            <div className="absolute inset-[1px] bg-gradient-to-br from-zinc-900/95 via-[#0f0f11] to-zinc-950/95 rounded-xl" />

            <div className="relative p-6">
              {product.isBestValue && (
                <span className="absolute top-4 right-4 rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-medium text-violet-400">
                  BEST VALUE
                </span>
              )}

              <h3 className="text-lg font-semibold text-text-primary">{product.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-text-primary">{product.price}</span>
                {product.priceDetail && (
                  <span className="text-sm text-text-secondary">{product.priceDetail}</span>
                )}
              </div>
              <p className="mt-1 text-xs text-text-muted">{product.description}</p>

              <ul className="mt-6 space-y-2">
                {product.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-text-secondary">
                    <span className="text-violet-400">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                <Button
                  variant={product.isBestValue ? "primary" : "ghost"}
                  size="md"
                  className="w-full"
                  onClick={() => handlePurchase(product.id)}
                  disabled={loading !== null}
                >
                  {loading === product.id ? (
                    <span className="flex items-center gap-2">
                      <Spinner size={14} /> Processing...
                    </span>
                  ) : product.id === "unlimited" ? (
                    "Subscribe"
                  ) : (
                    "Buy Now"
                  )}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-text-muted animate-fade-up" style={{ animationDelay: "100ms" }}>
        Fair use limits apply to prevent abuse. All purchases are processed securely via Stripe.
      </p>
    </div>
  );
}
```

---

## Phase 6: Dashboard Updates

### Modified: `/app/dashboard/page.tsx`

**Minimal changes** - enhance existing credits display (lines 129-136):

1. **Update StatsPayload type import** - use the type from `@/types` instead of local definition:
```typescript
import type { StatsPayload } from "@/types";
// Remove local StatsPayload type definition (lines 12-20)
```

2. **Replace credits display (lines 129-136) with:**
```tsx
<div className="flex items-center gap-3 rounded-lg border border-white/10 bg-surface/60 px-4 py-2.5">
  {['active', 'trialing', 'past_due'].includes(stats.subscription.status) ? (
    <>
      <span className="text-xs font-medium uppercase tracking-wider text-violet-400">
        {stats.subscription.status === 'trialing' ? 'Trial' : 'Unlimited'}
      </span>
      {stats.subscription.cancelAtPeriodEnd && (
        <span className="text-xs text-amber-400">Canceling</span>
      )}
      <span className="text-xs text-text-secondary">
        {stats.subscription.periodEnd 
          ? `${stats.subscription.cancelAtPeriodEnd ? 'Ends' : 'Renews'} ${new Date(stats.subscription.periodEnd).toLocaleDateString()}`
          : 'Active'}
      </span>
      <button
        onClick={async () => {
          const res = await fetch("/api/stripe/portal", { method: "POST" });
          const { url } = await res.json();
          if (url) window.location.href = url;
        }}
        className="text-xs text-text-muted hover:text-text-secondary transition-colors"
      >
        Manage
      </button>
    </>
  ) : (
    <>
      <span className="text-xs font-medium uppercase tracking-wider text-text-secondary/60">
        AI Credits
      </span>
      <span className="text-base font-semibold text-text-primary">
        {stats.aiCredits}
      </span>
      <Link href="/pricing" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
        Get More
      </Link>
    </>
  )}
</div>
```

3. **Add import at top:**
```typescript
import Link from "next/link";
```

---

## Phase 7: AIFeedback Updates

### Modified: `/components/results/AIFeedback.tsx`

**Minimal changes** - add upgrade link and rate limit handling:

1. **Add new props and state (extend interface):**
```typescript
export default function AIFeedback({
  responseId,
  initialCredits,
  initialFeedback,
  isSubscriber = false, // NEW
}: {
  responseId: string;
  initialCredits: number;
  initialFeedback?: string | null;
  isSubscriber?: boolean; // NEW
}) {
  // ... existing state ...
  const [retryAfter, setRetryAfter] = useState<number | null>(null); // NEW
```

2. **Update handleFetch to handle rate limiting:**
```typescript
const handleFetch = async () => {
  setLoading(true);
  setError(null);
  setRetryAfter(null);

  try {
    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ response_id: responseId }),
    });

    const payload = await response.json();

    if (response.status === 429) {
      // Rate limited
      setRetryAfter(payload.retry_after || 15);
      setError("Please wait before generating more feedback.");
      return;
    }

    if (!response.ok) {
      throw new Error(payload.error ?? "Failed to get feedback.");
    }

    setFeedback(payload.feedback ?? "");
    if (payload.creditsRemaining !== null) {
      setCredits(payload.creditsRemaining);
    }
  } catch (err) {
    setError((err as Error).message);
  } finally {
    setLoading(false);
  }
};
```

3. **Update button display for no credits (around line 105):**
```tsx
) : credits <= 0 && !isSubscriber ? (
  <Link href="/pricing" className="text-violet-400 underline">
    Get Credits
  </Link>
) : retryAfter !== null ? (
  `Wait ${retryAfter}s`
) : showRetry ? (
```

4. **Add countdown effect for rate limit:**
```typescript
// Add to existing useEffect imports at top of component
useEffect(() => {
  if (retryAfter === null || retryAfter <= 0) return;
  const timer = setInterval(() => {
    setRetryAfter((prev) => (prev && prev > 0 ? prev - 1 : null));
  }, 1000);
  return () => clearInterval(timer);
}, [retryAfter]);
```

5. **Add import:**
```typescript
import Link from "next/link";
// Note: useEffect is already imported from "react"
```

### Modified: `/app/problems/[id]/results/page.tsx`

**Pass subscription status to AIFeedback component:**

```typescript
// In the results page, fetch subscription status and pass to AIFeedback:

// Option 1: Fetch from /api/stats (already have stats endpoint)
const [isSubscriber, setIsSubscriber] = useState(false);

useEffect(() => {
  async function checkSubscription() {
    const res = await fetch("/api/stats");
    if (res.ok) {
      const data = await res.json();
      setIsSubscriber(['active', 'trialing', 'past_due'].includes(data.subscription?.status));
    }
  }
  if (user) checkSubscription();
}, [user]);

// Then pass to AIFeedback:
<AIFeedback
  responseId={response.id}
  initialCredits={credits}
  initialFeedback={response.ai_feedback}
  isSubscriber={isSubscriber}  // NEW
/>
```

---

## Phase 8: Navigation Update

### Modified: `/components/layout/Nav.tsx`

**Add single link after Dashboard (line 23):**

```tsx
<Link
  className="transition-colors duration-200 hover:text-text-primary focus-visible:outline-none focus-visible:text-text-primary"
  href="/pricing"
>
  Pricing
</Link>
```

---

## Summary: Critical Files

| File | Change Type | Lines Changed |
|------|-------------|---------------|
| `supabase/migrations/007_billing_schema.sql` | **NEW** | ~150 |
| `app/api/stripe/checkout/route.ts` | **NEW** | ~75 |
| `app/api/stripe/webhooks/route.ts` | **NEW** | ~200 |
| `app/api/stripe/portal/route.ts` | **NEW** | ~30 |
| `app/api/feedback/route.ts` | MODIFY | ~30 lines replaced |
| `app/api/stats/route.ts` | MODIFY | ~10 lines added |
| `app/pricing/page.tsx` | **NEW** | ~100 |
| `app/dashboard/page.tsx` | MODIFY | ~30 lines changed |
| `components/results/AIFeedback.tsx` | MODIFY | ~30 lines added |
| `components/layout/Nav.tsx` | MODIFY | 5 lines added |
| `types/index.ts` | MODIFY | ~35 lines added |

---

## Webhook Events to Configure in Stripe Dashboard

Configure your webhook endpoint (`https://yourdomain.com/api/stripe/webhooks`) to receive these events:

| Event | Purpose |
|-------|---------|
| `checkout.session.completed` | Initial purchase/subscription |
| `checkout.session.async_payment_succeeded` | Delayed payment methods succeed |
| `checkout.session.async_payment_failed` | Delayed payment methods failed (for monitoring) |
| `customer.subscription.created` | Subscription created (outside Checkout) |
| `customer.subscription.updated` | Status changes, cancellation scheduled |
| `customer.subscription.deleted` | Subscription fully ended |
| `invoice.paid` | Successful renewal (reactivates from past_due) |
| `invoice.payment_failed` | Payment failed (enters dunning) |

---

## Verification Plan

### Stripe CLI Testing

```bash
# Start webhook forwarding
stripe listen --forward-to localhost:3000/api/stripe/webhooks

# Test credit purchase flow
stripe trigger checkout.session.completed --add checkout_session:metadata[product_type]=credits_50

# Test subscription flows
stripe trigger customer.subscription.created
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
stripe trigger invoice.paid
stripe trigger invoice.payment_failed
```

### Database Function Tests (Supabase SQL Editor)

```sql
-- Test rate limiting
SELECT deduct_credit_atomic('test-user-id');
SELECT deduct_credit_atomic('test-user-id'); -- Should fail with rate_limited

-- Test credit deduction
SELECT * FROM public.credit_transactions WHERE user_id = 'test-user-id';

-- Test access helper
SELECT has_subscription_access('active');    -- true
SELECT has_subscription_access('trialing');  -- true
SELECT has_subscription_access('past_due');  -- true
SELECT has_subscription_access('canceled');  -- false
SELECT has_subscription_access('none');      -- false
```

### Manual Verification Checklist

1. **Credit purchase flow:**
   - [ ] Go to `/pricing` (not logged in → buttons redirect to signin)
   - [ ] Sign in and go to `/pricing`
   - [ ] Click "Buy Now" on 50 Credits → redirects to Stripe Checkout
   - [ ] Complete with test card `4242 4242 4242 4242`
   - [ ] Verify redirect to `/dashboard?checkout=success`
   - [ ] Verify credits increased by 50

2. **Subscription flow:**
   - [ ] Click "Subscribe" on Unlimited plan
   - [ ] Complete checkout
   - [ ] Verify dashboard shows "Unlimited" badge
   - [ ] Click "Manage" → opens Stripe Customer Portal
   - [ ] Cancel subscription in portal
   - [ ] Verify dashboard shows "Canceling" + end date

3. **Rate limiting:**
   - [ ] Generate AI feedback
   - [ ] Immediately try again → shows "Wait Xs" countdown
   - [ ] Wait for countdown → button becomes active

4. **No credits state:**
   - [ ] User with 0 credits sees "Get Credits" link
   - [ ] Clicking links to `/pricing`

---

## Dependencies

```bash
npm install stripe
```
