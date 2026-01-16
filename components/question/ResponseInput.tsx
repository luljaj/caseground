export default function ResponseInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <textarea
      className="min-h-[220px] w-full resize-none rounded-md border border-border bg-background px-4 py-3 text-sm leading-relaxed text-text-primary placeholder:text-text-secondary transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      placeholder="Write your response here..."
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
    />
  );
}
