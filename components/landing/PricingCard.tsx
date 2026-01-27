import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { motion } from "framer-motion";

interface PricingCardProps {
    title: string;
    price: string;
    description: string;
    features: string[];
    ctaText: string;
    ctaHref: string;
    popular?: boolean;
    className?: string;
    delay?: number;
    highlight?: boolean;
}

export default function PricingCard({
    title,
    price,
    description,
    features,
    ctaText,
    ctaHref,
    popular,
    className,
    delay = 0,
    highlight = false,
}: PricingCardProps) {

    // Styles copied from Button.tsx to ensure consistency while using Link
    const buttonBase = "inline-flex items-center justify-center rounded-3xl text-sm font-medium transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 border w-full";

    const primaryButton = "bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border-zinc-800 hover:border-zinc-700 hover:scale-[1.02] hover:shadow-2xl hover:shadow-zinc-950/50 px-8 py-3 text-white hover:text-zinc-100";

    // Custom transparent/ghost style for non-highlight cards
    const ghostButton = "bg-transparent border-zinc-700 text-white hover:bg-zinc-800 hover:text-white hover:scale-[1.02] px-8 py-3";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay }}
            className={cn(
                "relative p-8 rounded-3xl border flex flex-col h-full",
                highlight
                    ? "bg-zinc-900/80 border-zinc-700 shadow-2xl shadow-zinc-900/50"
                    : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700",
                "[transition:border-color_0.3s]",
                className
            )}
        >
            {popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-white text-zinc-950 text-[13px] font-medium rounded-full shadow-lg border border-zinc-200">
                    Most Popular
                </div>
            )}

            <div className="mb-8">
                <h3 className={cn("text-lg font-medium mb-2", highlight ? "text-white" : "text-zinc-200")}>
                    {title}
                </h3>
                <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-4xl font-bold text-white tracking-tight">{price}</span>
                    {price !== "Free" && <span className="text-zinc-500 text-sm">/mo</span>}
                </div>
                <p className="text-zinc-400 text-sm leading-relaxed">
                    {description}
                </p>
            </div>

            <div className="flex-1 mb-8 space-y-4">
                {features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3 text-[15px] text-zinc-300">
                        <Check size={16} className={cn("mt-1 shrink-0", highlight ? "text-white" : "text-zinc-500")} />
                        <span>{feature}</span>
                    </div>
                ))}
            </div>

            <Link
                href={ctaHref}
                className={cn(buttonBase, highlight ? primaryButton : ghostButton)}
            >
                {ctaText}
            </Link>
        </motion.div>
    );
}
