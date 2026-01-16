import Link from "next/link";
import DistortionGrid from "@/components/ui/DistortionGrid";
import ProblemListPreview from "@/components/ui/ProblemListPreview";

export default function HomePage() {
  return (
    <section className="relative overflow-hidden -mx-6 -my-6 md:-mx-12 md:-my-6 px-6 py-12 md:px-12 md:py-20 min-h-[80vh] flex flex-col justify-center">
      <div className="absolute inset-0 bg-atmosphere pointer-events-none" />
      <DistortionGrid />

      <div className="relative z-10 mx-auto max-w-6xl w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left: Hero Content */}
          <div className="lg:col-span-7 animate-fade-up">
            <h1 className="text-[40px] font-semibold tracking-tight leading-[1.1] md:text-[56px] text-white">
              Nail your next case interview with <span className="italic">caseground</span>.
            </h1>
            <p className="mt-6 text-[17px] leading-relaxed text-text-secondary max-w-xl">
              Timed practice for market sizing, behavioral questions, and logic puzzles.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
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

          {/* Right: Problem List Preview */}
          <div className="lg:col-span-5 animate-fade-up" style={{ animationDelay: "0.1s" }}>
            <ProblemListPreview />
          </div>
        </div>
      </div>
    </section>
  );
}
