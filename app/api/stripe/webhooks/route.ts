import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

export const runtime = "nodejs";

let stripeClient: Stripe | null = null;

function getStripeClient() {
  if (!stripeClient) {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new Error("Stripe secret key not configured");
    }
    stripeClient = new Stripe(apiKey);
  }
  return stripeClient;
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CREDITS_MAP: Record<string, number> = {
  credits_50: 50,
  credits_110: 110,
};

async function getUserId(
  session?: Stripe.Checkout.Session | null,
  customerId?: string | null
): Promise<string | null> {
  if (session?.metadata?.supabase_user_id) {
    return session.metadata.supabase_user_id;
  }
  if (session?.client_reference_id) {
    return session.client_reference_id;
  }
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

function getSubscriptionPeriodEnd(
  subscription: Stripe.Subscription
): number | null {
  const itemPeriodEnd = subscription.items?.data?.[0]?.current_period_end;
  if (itemPeriodEnd) return itemPeriodEnd;

  return (subscription as Stripe.Subscription & { current_period_end?: number })
    .current_period_end ?? null;
}

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
      subscription_cancel_at_period_end:
        subscription.cancel_at_period_end ?? false,
    })
    .eq("id", userId);
}

function getSubscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const parent = invoice.parent;
  if (
    parent?.type === "subscription_details" &&
    parent.subscription_details?.subscription
  ) {
    const subscription = parent.subscription_details.subscription;
    return typeof subscription === "string" ? subscription : subscription.id;
  }

  const legacySubscription = (
    invoice as Stripe.Invoice & {
      subscription?: string | Stripe.Subscription | null;
    }
  ).subscription;

  if (legacySubscription) {
    return typeof legacySubscription === "string"
      ? legacySubscription
      : legacySubscription.id;
  }

  return null;
}

export async function POST(request: Request) {
  const stripe = getStripeClient();
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

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

  const { data: existing } = await supabaseAdmin
    .from("webhook_events")
    .select("id, status")
    .eq("id", event.id)
    .single();

  if (existing) {
    if (existing.status === "processed") {
      return NextResponse.json({ received: true, duplicate: true });
    }
  } else {
    await supabaseAdmin
      .from("webhook_events")
      .insert({ id: event.id, event_type: event.type, status: "processing" });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = await getUserId(session);
        const productType = session.metadata?.product_type;

        if (!userId) {
          throw new Error(
            "checkout.session.completed: No user ID found in session metadata or client_reference_id"
          );
        }

        if (session.customer) {
          await supabaseAdmin
            .from("users")
            .update({ stripe_customer_id: session.customer as string })
            .eq("id", userId);
        }

        if (productType === "unlimited") {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string,
            { expand: ["items.data"] }
          );
          await updateSubscriptionStatus(userId, subscription);
        } else if (productType && CREDITS_MAP[productType]) {
          if (session.payment_status === "paid") {
            const credits = CREDITS_MAP[productType];
            await supabaseAdmin.rpc("add_credits", {
              p_user_id: userId,
              p_amount: credits,
              p_session_id: session.id,
              p_payment_intent_id: session.payment_intent as string | null,
            });
          }
        }
        break;
      }

      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = await getUserId(session);
        const productType = session.metadata?.product_type;

        if (!userId || !productType) {
          throw new Error("async_payment_succeeded: Missing user ID or product type");
        }

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

      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.warn(
          `Async payment failed for session ${session.id}, user: ${
            session.metadata?.supabase_user_id || session.client_reference_id
          }`
        );
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscriptionFromEvent = event.data.object as Stripe.Subscription;
        const customerId = subscriptionFromEvent.customer as string;

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

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id ?? null;

        const subscriptionId = getSubscriptionIdFromInvoice(invoice);
        if (!subscriptionId || !customerId) break;

        const subscription = await stripe.subscriptions.retrieve(
          subscriptionId,
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

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id ?? null;

        const subscriptionId = getSubscriptionIdFromInvoice(invoice);
        if (!subscriptionId || !customerId) break;

        await supabaseAdmin
          .from("users")
          .update({ stripe_subscription_status: "past_due" })
          .eq("stripe_customer_id", customerId);
        break;
      }
    }

    await supabaseAdmin
      .from("webhook_events")
      .update({ status: "processed", processed_at: new Date().toISOString() })
      .eq("id", event.id);
  } catch (err) {
    console.error(`Error processing webhook ${event.type}:`, err);

    await supabaseAdmin
      .from("webhook_events")
      .update({
        status: "failed",
        error_message: err instanceof Error ? err.message : "Unknown error",
      })
      .eq("id", event.id);

    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
