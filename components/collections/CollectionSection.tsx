import type { ReactNode } from "react";

export default function CollectionSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-text-secondary/70">
          {title}
        </h2>
      </div>
      <div className="-mx-6 overflow-x-auto px-6">
        <div className="grid auto-cols-[260px] grid-flow-col gap-4">
          {children}
        </div>
      </div>
    </section>
  );
}
