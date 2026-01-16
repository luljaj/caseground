"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

const Checkbox = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <div className="relative flex items-center">
    <input
      type="checkbox"
      ref={ref}
      className="peer h-4 w-4 opacity-0 absolute z-10 cursor-pointer"
      {...props}
    />
    <div
      className={cn(
        "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-white/20 ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 peer-checked:bg-accent peer-checked:text-white peer-checked:border-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent/40",
        className
      )}
    >
      <svg
        className="h-3 w-3 hidden peer-checked:block"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={3}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.5 12.75l6 6 9-13.5"
        />
      </svg>
    </div>
  </div>
));
Checkbox.displayName = "Checkbox";

export { Checkbox };
