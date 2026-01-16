export default function ExampleAnswer({ answer }: { answer: string }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-medium uppercase tracking-wider text-text-secondary/60">
        Example Answer
      </h3>
      <div className="rounded-lg border border-white/5 bg-surface/30 p-5">
        <p className="text-[15px] leading-relaxed text-text-secondary">
            {answer}
        </p>
      </div>
    </div>
  );
}
