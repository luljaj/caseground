import type { ReactNode } from "react";

export default function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
      <div className="w-full max-w-md rounded-md border border-border bg-surface p-6 shadow-[0_1px_3px_rgba(0,0,0,0.25)]">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
          <button
            className="text-sm text-text-secondary transition hover:text-text-primary"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="mt-4 text-sm text-text-secondary">{children}</div>
      </div>
    </div>
  );
}
