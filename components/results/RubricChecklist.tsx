"use client";

import { useState } from "react";
import type { RubricItem } from "@/types";

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
    <div className="space-y-3">
      {items.map((item) => (
        <label
          key={item.id}
          className="flex items-center gap-3 rounded-xl border border-border bg-background/40 px-3 py-2 text-sm text-text-secondary"
        >
          <input
            type="checkbox"
            checked={checked.has(item.id)}
            onChange={() => toggle(item.id)}
            className="h-4 w-4 rounded border-border bg-background"
          />
          <span>{item.text}</span>
        </label>
      ))}
    </div>
  );
}
