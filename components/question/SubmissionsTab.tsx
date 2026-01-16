import type { UserResponse } from "@/types";

export default function SubmissionsTab({
  responses,
}: {
  responses: UserResponse[];
}) {
  if (responses.length === 0) {
    return (
      <div className="text-sm text-text-secondary">
        No submissions yet. Start your first attempt.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {responses.map((response) => (
        <div
          key={response.id}
          className="rounded-2xl border border-border bg-background/40 p-4"
        >
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span>{new Date(response.created_at).toLocaleString()}</span>
            <span>
              {response.time_taken ? `${response.time_taken}s` : "No timer"}
            </span>
          </div>
          <p className="mt-3 text-sm text-text-primary">
            {response.response.length > 160
              ? `${response.response.slice(0, 160)}...`
              : response.response}
          </p>
        </div>
      ))}
    </div>
  );
}
