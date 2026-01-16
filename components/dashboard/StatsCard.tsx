export default function StatsCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-md border border-border/80 bg-surface/40 p-4">
      <p className="text-[11px] uppercase tracking-[0.2em] text-text-secondary">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold text-text-primary">{value}</p>
      {hint ? <p className="mt-2 text-xs text-text-secondary">{hint}</p> : null}
    </div>
  );
}
