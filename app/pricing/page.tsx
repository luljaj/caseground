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
      <div className="text-center mb-12 animate-fade-up">
        <h1 className="text-3xl font-semibold text-text-primary">Pricing</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Get AI-powered feedback on your case interview responses
        </p>
      </div>

      <div
        className="grid gap-6 md:grid-cols-3 animate-fade-up"
        style={{ animationDelay: "50ms" }}
      >
        {PRODUCTS.map((product) => (
          <div key={product.id} className="relative rounded-xl overflow-hidden">
            <div
              className={cn(
                "absolute inset-0 rounded-xl",
                product.isBestValue
                  ? "bg-gradient-to-br from-violet-500/40 via-blue-500/20 to-violet-600/40"
                  : "bg-gradient-to-br from-zinc-600/30 via-zinc-700/15 to-zinc-800/30"
              )}
            />
            <div className="absolute inset-[1px] bg-gradient-to-br from-zinc-900/95 via-[#0f0f11] to-zinc-950/95 rounded-xl" />

            <div className="relative p-6">
              {product.isBestValue && (
                <span className="absolute top-4 right-4 rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-medium text-violet-400">
                  BEST VALUE
                </span>
              )}

              <h3 className="text-lg font-semibold text-text-primary">
                {product.name}
              </h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-text-primary">
                  {product.price}
                </span>
                {product.priceDetail && (
                  <span className="text-sm text-text-secondary">
                    {product.priceDetail}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-text-muted">
                {product.description}
              </p>

              <ul className="mt-6 space-y-2">
                {product.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2 text-sm text-text-secondary"
                  >
                    <span className="text-violet-400">+</span>
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

      <p
        className="mt-8 text-center text-xs text-text-muted animate-fade-up"
        style={{ animationDelay: "100ms" }}
      >
        Fair use limits apply to prevent abuse. All purchases are processed
        securely via Stripe.
      </p>
    </div>
  );
}
