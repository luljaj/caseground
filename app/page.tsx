import Link from "next/link";

export default function HomePage() {
  return (
    <section className="relative overflow-hidden rounded-md border border-border/80 bg-surface/40 px-6 py-12 md:px-12">
      <div className="absolute inset-0 bg-atmosphere opacity-60" />
      <div className="relative z-10 mx-auto flex max-w-5xl flex-col gap-10">
        <div className="animate-fade-up">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-text-secondary">
            Business interview practice
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl">
            Train the skills that case interviews and business prompts demand.
          </h1>
          <p className="mt-4 max-w-2xl text-base text-text-secondary">
            Run timed drills, speak or type your response, then compare against a
            rubric and strong sample answers. Build confidence across
            estimations, behaviorals, and reasoning puzzles.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/problems"
              className="rounded-md border border-accent bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              Start practicing
            </Link>
            <Link
              href="/dashboard"
              className="rounded-md border border-border bg-surface px-5 py-2.5 text-sm font-medium text-text-primary transition-colors duration-150 hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              View dashboard
            </Link>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Estimations",
              copy: "Market sizing, cost, and volume drills with calibrated timing.",
            },
            {
              title: "Behaviorals",
              copy: "Structured prompts that sharpen leadership and judgment stories.",
            },
            {
              title: "Reasoning",
              copy: "Logic puzzles to test structure, clarity, and communication.",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-md border border-border/70 bg-surface/30 p-4"
            >
              <h3 className="text-base font-semibold text-text-primary">
                {card.title}
              </h3>
              <p className="mt-2 text-sm text-text-secondary">{card.copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
