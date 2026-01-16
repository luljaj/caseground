export default function ExampleAnswer({ answer }: { answer: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background/40 p-4">
      <h3 className="text-sm font-semibold text-text-primary">Example Answer</h3>
      <p className="mt-3 text-sm text-text-secondary">{answer}</p>
    </div>
  );
}
