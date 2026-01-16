import type { Category, SortParams, Track } from "@/types";

const trackOptions: Array<{ label: string; value: Track | "all" }> = [
  { label: "All Tracks", value: "all" },
  { label: "Estimations", value: "estimations" },
  { label: "Behaviorals", value: "behaviorals" },
  { label: "Reasoning", value: "reasoning" },
];

const categoryOptions: Record<Track, Array<{ label: string; value: Category }>> = {
  estimations: [
    { label: "Market Sizing", value: "market-sizing" },
    { label: "Volume", value: "volume" },
    { label: "Cost & Revenue", value: "cost-revenue" },
  ],
  behaviorals: [
    { label: "Easy", value: "easy" },
    { label: "Medium", value: "medium" },
    { label: "Hard", value: "hard" },
  ],
  reasoning: [{ label: "Logic", value: "logic" }],
};

const sortOptions = [
  { label: "Number (Asc)", value: "number:asc" },
  { label: "Number (Desc)", value: "number:desc" },
  { label: "Track (Asc)", value: "track:asc" },
  { label: "Track (Desc)", value: "track:desc" },
];

export default function ProblemFilters({
  track,
  category,
  notDone,
  sort,
  onTrackChange,
  onCategoryChange,
  onNotDoneChange,
  onSortChange,
}: {
  track: Track | "all";
  category: Category | "all";
  notDone: boolean;
  sort: SortParams;
  onTrackChange: (value: Track | "all") => void;
  onCategoryChange: (value: Category | "all") => void;
  onNotDoneChange: (value: boolean) => void;
  onSortChange: (value: SortParams) => void;
}) {
  const categories =
    track === "all"
      ? []
      : [{ label: "All Categories", value: "all" as const }, ...categoryOptions[track]];

  return (
    <div className="flex flex-col gap-4 rounded-md border border-border/80 bg-surface/40 p-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 flex-col gap-3 md:flex-row">
        <label className="flex flex-col gap-1 text-[11px] font-medium uppercase tracking-[0.18em] text-text-secondary">
          Track
          <select
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            value={track}
            onChange={(event) => onTrackChange(event.target.value as Track | "all")}
          >
            {trackOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-medium uppercase tracking-[0.18em] text-text-secondary">
          Category
          <select
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            value={category}
            onChange={(event) =>
              onCategoryChange(event.target.value as Category | "all")
            }
            disabled={track === "all"}
          >
            {track === "all" ? (
              <option value="all">All Categories</option>
            ) : (
              categories.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))
            )}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-medium uppercase tracking-[0.18em] text-text-secondary">
          Sort
          <select
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            value={`${sort.field}:${sort.direction}`}
            onChange={(event) => {
              const [field, direction] = event.target.value.split(":");
              onSortChange({
                field: field as SortParams["field"],
                direction: direction as SortParams["direction"],
              });
            }}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="flex items-center gap-2 text-[13px] text-text-secondary">
        <input
          type="checkbox"
          className="h-4 w-4 rounded-sm border-border bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          checked={notDone}
          onChange={(event) => onNotDoneChange(event.target.checked)}
        />
        Not done
      </label>
    </div>
  );
}
