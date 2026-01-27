import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { motion } from "framer-motion";

interface FeatureCardProps {
    icon: LucideIcon;
    title: string;
    description: string;
    className?: string;
    delay?: number;
}

export default function FeatureCard({
    icon: Icon,
    title,
    description,
    className,
    delay = 0
}: FeatureCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay }}
            className={cn(
                "group relative p-8 rounded-3xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm overflow-hidden",
                "hover:border-zinc-700 hover:shadow-2xl hover:shadow-zinc-900/50",
                "[transition:border-color_0.5s,box-shadow_0.5s]",
                className
            )}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative z-10">
                <div className="mb-6 inline-flex p-3 rounded-2xl bg-zinc-800/50 text-white border border-zinc-700/50 group-hover:scale-110 group-hover:bg-zinc-800 transition-all duration-300">
                    <Icon size={24} />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3 tracking-tight">
                    {title}
                </h3>
                <p className="text-zinc-400 leading-relaxed group-hover:text-zinc-300 transition-colors">
                    {description}
                </p>
            </div>
        </motion.div>
    );
}
