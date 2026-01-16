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

function FilterDropdown({
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
            "flex h-8 items-center gap-2 rounded-md border border-white/[0.06] bg-transparent px-3 text-[13px] text-text-primary transition-all duration-150",
            "hover:border-white/[0.12] hover:bg-white/[0.02]",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20",
            "disabled:cursor-not-allowed disabled:opacity-40",
            disabled && "text-text-muted"
          )}
          disabled={disabled}
          aria-label={ariaLabel}
        >
          <span className="truncate">{selectedLabel}</span>
          <svg
            className="h-3 w-3 shrink-0 text-text-muted"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M3 4.5L6 7.5L9 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </DropdownMenuTrigger>
      {disabled ? null : (
        <DropdownMenuContent align="start" className="min-w-[160px]">
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

function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <svg
        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M7 12.5C10.0376 12.5 12.5 10.0376 12.5 7C12.5 3.96243 10.0376 1.5 7 1.5C3.96243 1.5 1.5 3.96243 1.5 7C1.5 10.0376 3.96243 12.5 7 12.5Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14.5 14.5L11 11"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "h-8 w-full rounded-md border border-white/[0.06] bg-transparent pl-9 pr-3 text-[13px] text-text-primary placeholder:text-text-muted",
          "transition-all duration-150",
          "hover:border-white/[0.12]",
          "focus:border-white/[0.12] focus:outline-none focus:ring-1 focus:ring-white/10"
        )}
      />
    </div>
  );
}

export default function ProblemFilters({
  track,
  category,
  search,
  notDone,
  sort,
  onTrackChange,
  onCategoryChange,
  onSearchChange,
  onNotDoneChange,
  onSortChange,
}: {
  track: Track | "all";
  category: Category | "all";
  search: string;
  notDone: boolean;
  sort: SortParams;
  onTrackChange: (value: Track | "all") => void;
  onCategoryChange: (value: Category | "all") => void;
  onSearchChange: (value: string) => void;
  onNotDoneChange: (value: boolean) => void;
  onSortChange: (value: SortParams) => void;
}) {
  const categories =
    track === "all"
      ? []
      : [{ label: "All Categories", value: "all" as const }, ...categoryOptions[track]];
  const sortValue = `${sort.field}:${sort.direction}`;
  const isCategoryDisabled = track === "all";

  const tracks: Array<{ label: string; value: Track; color: string; underline: string }> = [
    { label: "Estimations", value: "estimations", color: "text-blue-400/70", underline: "bg-blue-400/70" },
    { label: "Behaviorals", value: "behaviorals", color: "text-violet-400/70", underline: "bg-violet-400/70" },
    { label: "Reasoning", value: "reasoning", color: "text-amber-400/70", underline: "bg-amber-400/70" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Track Tabs */}
      <div className="flex items-center gap-1 border-b border-white/[0.06]">
        <button
          onClick={() => onTrackChange("all")}
          className={cn(
            "relative px-3 py-2 text-[13px] font-medium transition-colors duration-150",
            track === "all"
              ? "text-text-primary"
              : "text-text-muted hover:text-text-secondary"
          )}
        >
          All
          {track === "all" && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-text-primary" />
          )}
        </button>
        {tracks.map((t) => (
          <button
            key={t.value}
            onClick={() => onTrackChange(t.value)}
            className={cn(
              "relative px-3 py-2 text-[13px] font-medium transition-colors duration-150",
              track === t.value
                ? t.color
                : "text-text-muted hover:text-text-secondary"
            )}
          >
            {t.label}
            {track === t.value && (
              <span className={`absolute bottom-0 left-0 right-0 h-[2px] ${t.underline}`} />
            )}
          </button>
        ))}
      </div>

      {/* Filters Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="w-full sm:w-56">
            <SearchInput
              value={search}
              onChange={onSearchChange}
              placeholder="Search questions..."
            />
          </div>
          <FilterDropdown
            value={category}
            options={categories}
            onValueChange={(value) =>
              onCategoryChange(value as Category | "all")
            }
            placeholder="Category"
            disabled={isCategoryDisabled}
            ariaLabel="Category"
          />
          <FilterDropdown
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

        <label className="flex cursor-pointer select-none items-center gap-2 text-[13px] text-text-secondary transition-colors hover:text-text-primary">
          <Checkbox
            id="hide-completed"
            checked={notDone}
            onChange={(event) => onNotDoneChange(event.target.checked)}
          />
          <span>Hide completed</span>
        </label>
      </div>
    </div>
  );
}
