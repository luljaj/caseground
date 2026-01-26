"use client";

import { ArrowLeft, BarChart3, BookOpen, Clock } from "lucide-react";
import type { Collection } from "@/types";
import Spinner from "@/components/ui/Spinner";
import { cn } from "@/lib/utils/cn";

interface RecommendedCollectionsProps {
  collections: Collection[];
  roleLabel: string;
  loading: boolean;
  isSaving: boolean;
  onBack: () => void;
  onLogoClick: () => void;
  onSkip: () => void;
  onViewAll: () => void;
  onView: (collection: Collection) => void;
}

const difficultyLabel = (difficulty: Collection["difficulty"]) => {
  if (!difficulty) {
    return "Mixed";
  }
  return `${difficulty.charAt(0).toUpperCase()}${difficulty.slice(1)}`;
};

const difficultyColor = (difficulty: Collection["difficulty"]) => {
  switch (difficulty) {
    case "beginner":
      return "text-emerald-400";
    case "intermediate":
      return "text-amber-400";
    case "advanced":
      return "text-orange-400";
    default:
      return "text-gray-400";
  }
};

const formatEstimatedTime = (minutes: number | null) => {
  if (!minutes) {
    return "Self-paced";
  }
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = minutes / 60;
  const formatted = Number.isInteger(hours) ? hours.toFixed(0) : hours.toFixed(1);
  return `${formatted} hours`;
};

export default function RecommendedCollections({
  collections,
  roleLabel,
  loading,
  isSaving,
  onBack,
  onLogoClick,
  onSkip,
  onViewAll,
  onView,
}: RecommendedCollectionsProps) {
  return (
    <div className="relative h-full flex flex-col overflow-hidden bg-[#0a0a0a] text-white">
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute right-1/4 top-0 h-96 w-96 rounded-full bg-zinc-500/10 blur-3xl animate-pulse" />
        <div
          className="absolute bottom-0 left-1/4 h-96 w-96 rounded-full bg-zinc-400/10 blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className="relative z-60 flex h-full flex-col p-4 md:p-6 lg:p-8">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="cursor-pointer rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        </div>

        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col">
          <div className="mt-12 mb-6 text-center">
            <h1 className="text-sm font-medium text-zinc-500 uppercase tracking-widest">
              Recommended for {roleLabel}
            </h1>
          </div>

          {loading ? (
            <div className="flex flex-1 items-center justify-center py-16">
              <Spinner size={28} />
            </div>
          ) : collections.length === 0 ? (
            <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-8 text-center text-sm text-gray-400">
              <p className="text-base font-semibold text-white">No collections available</p>
              <p className="mt-2">Check back soon for curated practice sets.</p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-3">
              {collections.map((collection) => {
                const description =
                  collection.description ||
                  collection.long_description ||
                  "Practice a curated set of problems to build confidence fast.";
                const problems = collection.problem_ids.length;
                const estimatedTime = formatEstimatedTime(collection.estimated_time_minutes);
                const difficulty = difficultyLabel(collection.difficulty);
                return (
                  <div
                    key={collection.id}
                    className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-4 transition-all hover:border-[#3a3a3a] hover:shadow-xl"
                  >
                    <div className="mb-3">
                      <h3 className="mb-1 text-base font-semibold">{collection.name}</h3>
                      <p className="text-xs text-gray-400 line-clamp-2">{description}</p>
                    </div>

                    <div className="mb-4 space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-zinc-400" />
                        <span className="text-gray-400">{problems} problems</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-zinc-400" />
                        <span className="text-gray-400">{estimatedTime}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-zinc-400" />
                        <span className={difficultyColor(collection.difficulty)}>{difficulty}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onView(collection)}
                      disabled={isSaving}
                      className={cn(
                        "w-full rounded-lg bg-white px-3 py-2 text-xs font-semibold text-black transition-colors hover:bg-zinc-200",
                        isSaving ? "cursor-not-allowed opacity-60" : ""
                      )}
                    >
                      View Collection
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onViewAll}
              disabled={isSaving}
              className={cn(
                "rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-5 py-2.5 text-xs font-medium transition-all",
                isSaving
                  ? "cursor-not-allowed opacity-60"
                  : "hover:border-[#3a3a3a]"
              )}
            >
              View All Collections
            </button>
            <button
              type="button"
              onClick={onSkip}
              disabled={isSaving}
              className={cn(
                "px-5 py-2.5 text-xs font-medium text-gray-400 transition-colors",
                isSaving ? "cursor-not-allowed opacity-60" : "hover:text-white"
              )}
            >
              Skip to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
