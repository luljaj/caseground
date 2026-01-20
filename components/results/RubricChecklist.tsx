"use client";

import { useState, useEffect } from "react";
import type { RubricItem } from "@/types";
import { Checkbox } from "@/components/ui/Checkbox";
import { cn } from "@/lib/utils/cn";

interface RubricChecklistProps {
  items: RubricItem[];
  onCheckedChange?: (checkedCount: number) => void;
}

export default function RubricChecklist({ items, onCheckedChange }: RubricChecklistProps) {
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

  useEffect(() => {
    onCheckedChange?.(checked.size);
  }, [checked.size, onCheckedChange]);

  return (
    <div className="relative rounded-xl overflow-hidden">
      {/* Zinc gradient border */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-600/30 via-zinc-700/15 to-zinc-800/30 rounded-xl" />
      <div className="absolute inset-[1px] bg-gradient-to-br from-zinc-900/95 via-[#0f0f11] to-zinc-950/95 rounded-xl" />

      <div className="relative p-5">
        {/* Header with score badge */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Rubric
          </h3>
          <span className="text-xs font-medium text-zinc-400 bg-zinc-800/60 px-2.5 py-1 rounded-md">
            {checked.size}/{items.length}
          </span>
        </div>

        {/* Checklist items */}
        <div className="space-y-1">
          {items.map((item) => {
            const isChecked = checked.has(item.id);
            return (
              <div
                key={item.id}
                className="group flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-zinc-800/40"
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
                    "cursor-pointer text-sm leading-relaxed transition-all duration-150 select-none",
                    isChecked
                      ? "text-zinc-600 line-through"
                      : "text-zinc-300 group-hover:text-zinc-100"
                  )}
                >
                  {item.text}
                </label>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
