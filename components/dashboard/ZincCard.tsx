"use client";

import { ReactNode } from "react";

interface ZincCardProps {
    children: ReactNode;
    /** Optional violet accent glow on hover (for premium/unlimited states) */
    accentGlow?: boolean;
    /** Optional custom className for the outer wrapper */
    className?: string;
}

export function ZincCard({ children, accentGlow = false, className = "" }: ZincCardProps) {
    return (
        <div className={`relative group ${className}`}>
            <div className={`relative bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 rounded-3xl overflow-hidden border transition-all duration-300 hover:scale-[1.01] ${accentGlow
                ? "border-violet-500/20 hover:border-violet-500/30"
                : "border-zinc-800 hover:border-zinc-700"
                }`}>
                {/* Content wrapper with standardized height */}
                <div className="relative p-6 px-8 h-24 flex items-center">
                    <div className="flex items-center justify-between gap-4 w-full">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
