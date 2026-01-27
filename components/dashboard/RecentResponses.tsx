import Link from "next/link";
import type { Track } from "@/types";

export type RecentResponseCard = {
  id: string;
  questionId: string;
  title: string;
  track: Track | null;
  category: string | null;
  createdAt: string;
  responsePreview: string;
  timeTaken: number | null;
};

const TRACK_LABELS: Record<Track, string> = {
  estimations: "Estimations",
  behaviorals: "Behaviorals",
  reasoning: "Reasoning",
};

const formatTimeTaken = (seconds: number | null) => {
  if (!seconds) return null;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
};

export default function RecentResponses({
  responses,
}: {
  responses: RecentResponseCard[];
}) {
  if (responses.length === 0) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-zinc-700/50 bg-zinc-800/50 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-medium uppercase tracking-wider text-text-secondary/60">
          Recent Responses
        </h2>
        <Link href="/problems" className="text-xs text-text-secondary hover:text-text-primary">
          View all
        </Link>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {responses.map((response) => {
          const trackLabel = response.track ? TRACK_LABELS[response.track] : null;
          const timeLabel = formatTimeTaken(response.timeTaken);
          return (
            <Link
              key={response.id}
              href={`/problems/${response.questionId}/results?response_id=${response.id}`}
              className="rounded-2xl border border-white/10 bg-surface/40 p-4 transition-all hover:border-white/20"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide text-text-muted">
                    {trackLabel ? (
                      <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-blue-300">
                        {trackLabel}
                      </span>
                    ) : null}
                    {response.category ? (
                      <span className="rounded-full bg-white/5 px-2 py-0.5 text-text-secondary">
                        {response.category}
                      </span>
                    ) : null}
                    {timeLabel ? (
                      <span className="rounded-full bg-white/5 px-2 py-0.5 text-text-secondary">
                        {timeLabel}
                      </span>
                    ) : null}
                  </div>
                  <h3 className="text-sm font-semibold text-text-primary">
                    {response.title}
                  </h3>
                </div>
                <span className="text-xs text-text-muted">
                  {new Date(response.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="mt-3 text-xs text-text-secondary">
                {response.responsePreview}
              </p>
              <div className="mt-3 text-xs text-blue-400">View feedback</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
