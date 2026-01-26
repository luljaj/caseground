"use client";

import Link from "next/link";
import CollectionRing from "@/components/collections/CollectionRing";
import { cn } from "@/lib/utils/cn";

type CollectionCardProps = {
  title: string;
  description?: string | null;
  difficulty?: string | null;
  estimatedMinutes?: number | null;
  problemCount: number;
  attemptedPercent?: number;
  isComplete?: boolean;
  href?: string;
  onClick?: () => void;
  showRing?: boolean;
  actionLabel?: string;
};

function formatDifficulty(value?: string | null) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function CollectionCard({
  title,
  description,
  difficulty,
  estimatedMinutes,
  problemCount,
  attemptedPercent = 0,
  isComplete = false,
  href,
  onClick,
  showRing = true,
  actionLabel,
}: CollectionCardProps) {
  const content = (
    <div className="group relative flex h-full flex-col gap-4 rounded-2xl border border-white/10 bg-surface/40 p-4 transition-all duration-300 hover:border-white/20 hover:bg-surface/60">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-text-primary line-clamp-1">
            {title}
          </h3>
          {description ? (
            <p className="mt-1 text-xs text-text-secondary line-clamp-2">
              {description}
            </p>
          ) : null}
        </div>
        {showRing ? (
          <CollectionRing
            attemptedPercent={attemptedPercent}
            isComplete={isComplete}
          />
        ) : null}
      </div>
      <div className="mt-auto flex items-center justify-between text-xs text-text-muted">
        <span>
          {problemCount} {problemCount === 1 ? "problem" : "problems"}
          {estimatedMinutes ? ` | ${estimatedMinutes} min` : ""}
        </span>
        {difficulty ? (
          <span className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-text-secondary">
            {formatDifficulty(difficulty)}
          </span>
        ) : null}
      </div>
      {actionLabel ? (
        <span className="text-xs font-medium text-text-primary underline decoration-white/40 underline-offset-4">
          {actionLabel}
        </span>
      ) : null}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn("block h-full w-full text-left", "focus-visible:outline-none")}
      >
        {content}
      </button>
    );
  }

  return content;
}
