import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const baseClasses =
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:pointer-events-none disabled:opacity-50 border";

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 rounded-3xl border border-zinc-800 hover:border-zinc-700 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-zinc-950/50 px-8 py-4 text-white hover:text-zinc-100",
  secondary:
    "bg-gradient-to-br from-white via-white to-zinc-50 rounded-3xl border border-zinc-200 hover:border-zinc-300 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-zinc-950/10 px-8 py-3 text-zinc-900 hover:text-black",
  ghost:
    "bg-transparent rounded-3xl border border-zinc-800 hover:border-zinc-700 transition-all duration-300 hover:scale-[1.02] hover:bg-zinc-900/50 px-8 py-3 text-zinc-400 hover:text-zinc-100",
  danger:
    "bg-gradient-to-br from-red-800 via-red-800 to-red-900 rounded-3xl border border-red-700 hover:border-red-600 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-red-950/50 px-8 py-3 text-white hover:text-red-50",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4",
  lg: "h-12 px-6 text-[15px]",
};

export default function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(baseClasses, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}
