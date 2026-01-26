"use client";

import Button from "@/components/ui/Button";

export default function ExitConfirmModal({
  open,
  onCancel,
  onConfirm,
  onReturn,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  onReturn?: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-surface p-6 shadow-2xl">
        <h3 className="text-lg font-semibold text-text-primary">Exit Collection?</h3>
        <p className="mt-2 text-sm text-text-secondary">
          Your submissions have been saved. Exiting will return you to the collections page.
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          {onReturn ? (
            <Button variant="ghost" size="sm" onClick={onReturn}>
              Return to Collection
            </Button>
          ) : null}
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={onConfirm}>
            Exit Collection
          </Button>
        </div>
      </div>
    </div>
  );
}
