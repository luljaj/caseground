export default function ExampleAnswer({ answer }: { answer: string }) {
  return (
    <div className="rounded-md border border-border/80 bg-background/30 p-4">
      <h3 className="text-sm font-semibold text-text-primary">Example Answer</h3>
      <p className="mt-3 text-sm leading-relaxed text-text-secondary">{answer}</p>
    </div>
  );
}
