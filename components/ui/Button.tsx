import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const baseClasses =
  "inline-flex items-center justify-center rounded-md border text-sm font-medium transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary:
    "border-accent bg-accent text-white hover:bg-accent/90 hover:shadow-[0_1px_3px_rgba(0,0,0,0.18)]",
  secondary:
    "border-border bg-surface text-text-primary hover:border-accent/40 hover:text-text-primary hover:shadow-[0_1px_3px_rgba(0,0,0,0.12)]",
  ghost:
    "border-transparent bg-transparent text-text-secondary hover:text-text-primary",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-[13px]",
  md: "px-4 py-2",
  lg: "px-5 py-2.5 text-sm",
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
