"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { Check } from "lucide-react";

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
        "flex h-4 w-4 shrink-0 items-center justify-center rounded border border-zinc-700 bg-transparent transition-all peer-checked:bg-white peer-checked:border-white",
        className
      )}
    >
      <Check className="h-3 w-3 text-black hidden peer-checked:block" strokeWidth={3} />
    </div>
  </div>
));
Checkbox.displayName = "Checkbox";

export { Checkbox };
