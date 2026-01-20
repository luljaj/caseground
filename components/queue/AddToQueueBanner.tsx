"use client";

import Button from "@/components/ui/Button";

export default function AddToQueueBanner({
  count,
  onDone,
}: {
  count: number;
  onDone: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="h-2 w-2 rounded-full bg-blue-400"
        />
        <span>Adding to Queue ({count} added)</span>
      </div>
      <Button size="sm" variant="ghost" onClick={onDone}>
        Done
      </Button>
    </div>
  );
}
