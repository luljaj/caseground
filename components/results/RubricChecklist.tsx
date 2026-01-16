"use client";

import { useState } from "react";
import type { RubricItem } from "@/types";
import { Checkbox } from "@/components/ui/Checkbox";
import { cn } from "@/lib/utils/cn";

export default function RubricChecklist({ items }: { items: RubricItem[] }) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="space-y-1">
      {items.map((item) => {
        const isChecked = checked.has(item.id);
        return (
          <div
            key={item.id}
            className="group flex items-start gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-white/[0.03]"
          >
            <div className="pt-0.5">
                <Checkbox
                    id={item.id}
                    checked={isChecked}
                    onChange={() => toggle(item.id)}
                />
            </div>
            <label 
                htmlFor={item.id}
                className={cn(
                    "cursor-pointer text-sm leading-relaxed transition-colors select-none",
                    isChecked ? "text-text-secondary line-through opacity-70" : "text-text-primary"
                )}
            >
              {item.text}
            </label>
          </div>
        );
      })}
    </div>
  );
}
