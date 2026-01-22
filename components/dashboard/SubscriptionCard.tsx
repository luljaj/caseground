"use client";

import { Crown, Sparkles, ExternalLink } from "lucide-react";
import { ZincCard } from "./ZincCard";

interface SubscriptionCardProps {
    status: "free" | "unlimited" | "trialing";
    periodEnd?: string | null;
    cancelAtPeriodEnd?: boolean;
    onManage?: () => void;
}

export function SubscriptionCard({
    status,
    periodEnd,
    cancelAtPeriodEnd,
    onManage,
}: SubscriptionCardProps) {
    const isUnlimited = status === "unlimited" || status === "trialing";

    return (
        <ZincCard accentGlow={isUnlimited}>
            <div className="flex items-center gap-3">
                {/* Icon with animation */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${isUnlimited
                    ? "bg-violet-500/20 group-hover:bg-violet-500/30"
                    : "bg-zinc-800 group-hover:bg-zinc-700"
                    }`}>
                    {isUnlimited ? (
                        <Crown className="w-5 h-5 text-violet-400 group-hover:text-violet-300 transition-colors" />
                    ) : (
                        <Sparkles className="w-5 h-5 text-zinc-400 group-hover:text-zinc-300 transition-colors" />
                    )}
                </div>

                <div>
                    <h3 className={`text-xl font-semibold leading-tight transition-colors ${isUnlimited
                        ? "text-violet-100 group-hover:text-white"
                        : "text-white group-hover:text-zinc-100"
                        }`}>
                        {status === "trialing" ? "Trial" : isUnlimited ? "Unlimited" : "Free"}
                    </h3>
                    {periodEnd && (
                        <p className="text-zinc-400 text-xs mt-0.5 group-hover:text-zinc-300 transition-colors">
                            {cancelAtPeriodEnd ? "Ends" : "Renews"}{" "}
                            {new Date(periodEnd).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                            })}
                        </p>
                    )}
                    {!periodEnd && !isUnlimited && (
                        <p className="text-zinc-500 text-xs mt-0.5">
                            Limited features
                        </p>
                    )}
                </div>
            </div>

            {/* Status badge & manage button - pushed to right */}
            <div className="flex items-center gap-3 ml-auto">
                {cancelAtPeriodEnd && (
                    <span className="px-2 py-1 text-xs font-medium rounded-md bg-amber-500/20 text-amber-400 animate-pulse">
                        Canceling
                    </span>
                )}

                {isUnlimited && onManage && (
                    <button
                        onClick={onManage}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 text-zinc-300 hover:text-white transition-all duration-200 hover:scale-105 group/btn"
                    >
                        Manage
                        <ExternalLink className="w-3 h-3 opacity-60 group-hover/btn:opacity-100 transition-opacity" />
                    </button>
                )}

                {!isUnlimited && onManage && (
                    <button
                        onClick={onManage}
                        className="relative overflow-hidden px-4 py-2 text-xs font-semibold rounded-lg bg-white text-zinc-900 transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg"
                    >
                        <span className="relative">Upgrade</span>
                    </button>
                )}
            </div>
        </ZincCard>
    );
}


