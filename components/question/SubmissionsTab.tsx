import type { UserResponse } from "@/types";

function formatTimeTaken(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

export default function SubmissionsTab({
  responses,
}: {
  responses: UserResponse[];
}) {
  if (responses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-[13px] text-text-secondary">
          No submissions yet. Start your first attempt.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {responses.map((response, index) => (
        <div
          key={response.id}
          className="rounded-md border border-white/[0.06] p-4 transition-colors hover:border-white/[0.1]"
        >
          <div className="flex items-center justify-between text-[12px] text-text-muted">
            <span>Attempt {responses.length - index}</span>
            <div className="flex items-center gap-3">
              {response.time_taken && (
                <span>{formatTimeTaken(response.time_taken)}</span>
              )}
              <span>
                {new Date(response.created_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-text-secondary">
            {response.response.length > 180
              ? `${response.response.slice(0, 180)}...`
              : response.response}
          </p>
        </div>
      ))}
    </div>
  );
}
