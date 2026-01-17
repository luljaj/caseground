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
                className="bg-gradient-to-br from-white via-white to-zinc-50 rounded-3xl border border-zinc-200 hover:border-zinc-300 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-zinc-950/10 px-8 py-3 text-zinc-900 hover:text-black"
              >
                Start practicing
              </Link>
              <Link
                href="/dashboard"
                className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 rounded-3xl border border-zinc-800 hover:border-zinc-700 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-zinc-950/50 px-8 py-3 text-white hover:text-zinc-100"
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
