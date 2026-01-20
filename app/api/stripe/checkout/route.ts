import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

type ProductType = "credits_50" | "credits_110" | "unlimited";

const PRICE_MAP: Record<ProductType, string> = {
  credits_50: process.env.STRIPE_PRICE_CREDITS_50!,
  credits_110: process.env.STRIPE_PRICE_CREDITS_110!,
  unlimited: process.env.STRIPE_PRICE_UNLIMITED!,
};

export async function POST(request: Request) {
  const stripe = getStripeClient();
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { product?: ProductType } | null = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const productType = body?.product;

  if (!productType || !PRICE_MAP[productType]) {
    return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    return NextResponse.json(
      { error: "App URL not configured" },
      { status: 500 }
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("stripe_customer_id, email")
    .eq("id", user.id)
    .single();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  let customerId = profile?.stripe_customer_id ?? null;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email || profile?.email,
      metadata: { supabase_user_id: user.id },
    });

    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      "set_stripe_customer_id",
      {
        p_user_id: user.id,
        p_customer_id: customer.id,
      }
    );

    if (rpcError) {
      return NextResponse.json({ error: rpcError.message }, { status: 500 });
    }

    if (rpcResult?.was_existing) {
      customerId = rpcResult.customer_id;
    } else {
      customerId = customer.id;
    }
  }

  const isSubscription = productType === "unlimited";

  const sessionConfig: Stripe.Checkout.SessionCreateParams = {
    customer: customerId ?? undefined,
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
