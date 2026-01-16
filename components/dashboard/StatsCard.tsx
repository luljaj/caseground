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
    <div className="rounded-md border border-border bg-surface/40 p-5">
      <p className="text-sm font-medium text-text-secondary">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-text-primary">{value}</p>
      {hint ? <p className="mt-1 text-[13px] text-text-secondary/80">{hint}</p> : null}
    </div>
  );
}
