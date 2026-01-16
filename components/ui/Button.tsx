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
    "border-transparent bg-accent text-white shadow-[0_1px_2px_rgba(0,0,0,0.2)] hover:bg-accent/90 hover:shadow-[0_2px_4px_rgba(0,0,0,0.2)]",
  secondary:
    "border-border bg-surface text-text-primary shadow-sm hover:bg-surface/80 hover:border-text-secondary/30",
  ghost:
    "border-transparent bg-transparent text-text-secondary hover:bg-white/5 hover:text-text-primary",
  danger:
    "border-transparent bg-error/10 text-error hover:bg-error/20",
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
