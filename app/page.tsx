import Link from "next/link";
import DistortionGrid from "@/components/ui/DistortionGrid";

export default function HomePage() {
  return (
    <section className="relative overflow-hidden px-6 py-12 md:px-12 md:py-20 min-h-[80vh] flex flex-col justify-center">
      <div className="absolute inset-0 bg-atmosphere pointer-events-none" />
      <DistortionGrid />
      
      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center text-center gap-10">
        <div className="animate-fade-up">
          <h1 className="text-[40px] font-semibold tracking-tight leading-[1.1] md:text-[56px] text-white">
            Master the business interview.
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-[17px] leading-relaxed text-text-secondary">
            Practice estimations, behaviorals, and reasoning puzzles with calibrated timers 
            and AI feedback. Built for high-performance candidates.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/problems"
              className="rounded h-10 px-6 flex items-center text-sm font-medium bg-white text-black hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            >
              Start practicing
            </Link>
            <Link
              href="/dashboard"
              className="rounded h-10 px-6 flex items-center text-sm font-medium border border-border bg-transparent text-text-primary hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border"
            >
              Dashboard
            </Link>
          </div>
        </div>

        <div className="mt-16 grid w-full gap-6 md:grid-cols-3 text-left">
          {[
            {
              title: "Estimations",
              copy: "Market sizing and volume drills.",
            },
            {
              title: "Behaviorals",
              copy: "Refine your leadership stories.",
            },
            {
              title: "Reasoning",
              copy: "Logic puzzles for clarity.",
            },
          ].map((card) => (
            <Link
              key={card.title}
              href={`/problems?track=${card.title.toLowerCase()}`}
              className="group rounded-lg border border-border bg-surface/50 p-6 hover:border-white/10 hover:bg-white/5 transition-all duration-200"
            >
              <h3 className="text-[15px] font-medium text-text-primary">
                {card.title}
              </h3>
              <p className="mt-1 text-[14px] text-text-secondary group-hover:text-text-secondary/80">
                {card.copy}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
