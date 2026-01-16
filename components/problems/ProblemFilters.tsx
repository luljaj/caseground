import type { Category, SortParams, Track } from "@/types";
import { Checkbox } from "@/components/ui/Checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils/cn";

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
  reasoning: [
    { label: "Logic", value: "logic" },
    { label: "Financial Statements", value: "Financial Statements" },
    { label: "Valuation", value: "Valuation" },
    { label: "DCF Analysis", value: "DCF Analysis" },
    { label: "Merger Models", value: "Merger Models" },
    { label: "LBO Models", value: "LBO Models" },
  ],
};

const sortOptions = [
  { label: "Number (Asc)", value: "number:asc" },
  { label: "Number (Desc)", value: "number:desc" },
  { label: "Track (Asc)", value: "track:asc" },
  { label: "Track (Desc)", value: "track:desc" },
];

type DropdownOption = { label: string; value: string };

const dropdownTriggerStyles =
  "flex h-9 w-[140px] items-center justify-between rounded-md border border-white/10 bg-surface px-3 py-2 text-sm text-text-primary shadow-sm transition-colors hover:border-white/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20 disabled:cursor-not-allowed disabled:opacity-50";

function DropdownSelect({
  value,
  options,
  onValueChange,
  placeholder = "Select",
  disabled = false,
  ariaLabel,
}: {
  value: string;
  options: DropdownOption[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  ariaLabel: string;
}) {
  const selectedLabel =
    options.find((option) => option.value === value)?.label ?? placeholder;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            dropdownTriggerStyles,
            disabled && "text-text-secondary/70"
          )}
          disabled={disabled}
          aria-label={ariaLabel}
        >
          <span className="truncate">{selectedLabel}</span>
          <svg
            className="ml-2 h-3 w-3 shrink-0 opacity-60"
            viewBox="0 0 10 6"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M1 1L5 5L9 1"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </DropdownMenuTrigger>
      {disabled ? null : (
        <DropdownMenuContent align="start" className="min-w-[140px]">
          <DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
            {options.map((option) => (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      )}
    </DropdownMenu>
  );
}

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
  const sortValue = `${sort.field}:${sort.direction}`;
  const isCategoryDisabled = track === "all";

  const tracks: Array<{ label: string; value: Track }> = [
    { label: "Estimations", value: "estimations" },
    { label: "Behaviorals", value: "behaviorals" },
    { label: "Reasoning", value: "reasoning" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-wrap gap-2">
          <DropdownSelect
            value={track}
            options={trackOptions}
            onValueChange={(value) => onTrackChange(value as Track | "all")}
            placeholder="All Tracks"
            ariaLabel="Track"
          />
          <DropdownSelect
            value={category}
            options={categories}
            onValueChange={(value) =>
              onCategoryChange(value as Category | "all")
            }
            placeholder="Category"
            disabled={isCategoryDisabled}
            ariaLabel="Category"
          />
          <DropdownSelect
            value={sortValue}
            options={sortOptions}
            onValueChange={(value) => {
              const [field, direction] = value.split(":");
              onSortChange({
                field: field as SortParams["field"],
                direction: direction as SortParams["direction"],
              });
            }}
            placeholder="Sort"
            ariaLabel="Sort"
          />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox 
            id="hide-completed"
            checked={notDone}
            onChange={(event) => onNotDoneChange(event.target.checked)}
          />
          <label htmlFor="hide-completed" className="text-sm text-text-secondary select-none cursor-pointer">
            Hide completed
          </label>
        </div>
      </div>
      
      {/* Track Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
         <span className="text-[11px] font-medium uppercase tracking-wider text-text-secondary/60 mr-2">
            Tracks
         </span>
         <button
            onClick={() => onTrackChange("all")}
            className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap",
                track === "all"
                    ? "border-white/20 bg-white/10 text-white"
                    : "border-transparent bg-transparent text-text-secondary hover:text-text-primary hover:bg-white/5"
            )}
         >
            All
         </button>
         {tracks.map((t) => (
            <button
                key={t.value}
                onClick={() => onTrackChange(t.value)}
                className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap",
                    track === t.value
                        ? "border-white/20 bg-white/10 text-white"
                        : "border-transparent bg-transparent text-text-secondary hover:text-text-primary hover:bg-white/5"
                )}
            >
                {t.label}
            </button>
         ))}
      </div>
    </div>
  );
}
