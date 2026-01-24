"use client";

import { Plus, Infinity } from "lucide-react";

interface CreditCardProps {
    title: string;
    description?: string;
    count?: number;
    unlimited?: boolean;
    onAddCredits?: () => void;
}

export function CreditCard({
    title,
    description,
    count = 0,
    unlimited = false,
    onAddCredits,
}: CreditCardProps) {
    return (
        <div className="relative group">
            <div className="relative bg-gradient-to-br from-zinc-900 via-zinc-900 to-[#1f1f23] rounded-3xl overflow-hidden border border-zinc-800 hover:border-zinc-700 transition-all duration-300 hover:scale-[1.01]">
                {/* Content */}
                <div className="relative p-6 px-8 h-24 flex items-center">
                    <div className="flex items-center justify-between gap-4 w-full">
                        <div>
                            <h3 className="text-white text-xl font-semibold leading-tight group-hover:text-zinc-100 transition-colors">
                                {title}
                            </h3>
                            {description && (
                                <p className="text-zinc-400 text-sm mt-0.5 group-hover:text-zinc-300 transition-colors">
                                    {description}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-3 ml-auto">
                            {unlimited ? (
                                <div className="flex items-center gap-2">
                                    <Infinity
                                        className="w-8 h-8 text-violet-400"
                                        strokeWidth={2.5}
                                    />
                                </div>
                            ) : (
                                <>
                                    <div className="text-white text-3xl font-bold tabular-nums">
                                        {count}
                                    </div>
                                    {onAddCredits && (
                                        <button
                                            onClick={onAddCredits}
                                            className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 flex items-center justify-center transition-all duration-200 hover:scale-105 group/btn"
                                        >
                                            <Plus className="w-4 h-4 text-zinc-400 group-hover/btn:text-white transition-colors" />
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}