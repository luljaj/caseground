"use client";

import { useRef, useEffect, useState } from "react";
import type { Category, SortParams, Track } from "@/types";
import { Search } from "lucide-react";
import { Checkbox } from "@/components/ui/Checkbox";
import Dropdown from "@/components/ui/Dropdown";

type TrackFilter = Track | "all";

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

export default function ProblemFilters({
  track,
  category,
  search,
  notDone,
  sort,
  view,
  onTrackChange,
  onCategoryChange,
  onSearchChange,
  onNotDoneChange,
  onSortChange,
  onViewChange,
}: {
  track: Track | "all";
  category: Category | "all";
  search: string;
  notDone: boolean;
  sort: SortParams;
  view: "list" | "queue";
  onTrackChange: (value: Track | "all") => void;
  onCategoryChange: (value: Category | "all") => void;
  onSearchChange: (value: string) => void;
  onNotDoneChange: (value: boolean) => void;
  onSortChange: (value: SortParams) => void;
  onViewChange: (value: "list" | "queue") => void;
}) {
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  // Refs for each tab button
  const tabRefs = useRef<{ [key in TrackFilter]: HTMLButtonElement | null }>({
    all: null,
    estimations: null,
    behaviorals: null,
    reasoning: null,
  });

  // Update indicator position when active track changes
  useEffect(() => {
    const activeButton = tabRefs.current[track];
    if (activeButton) {
      setIndicatorStyle({
        left: activeButton.offsetLeft,
        width: activeButton.offsetWidth,
      });
    }
  }, [track]);

  // Get category options for current track
  const categories =
    track === "all"
      ? []
      : [
          { label: "All Categories", value: "all" },
          ...categoryOptions[track],
        ];

  // Sort options
  const sortOptions = [
    { value: "number:asc", label: "Number" },
    { value: "title:asc", label: "Title" },
    { value: "track:asc", label: "Track" },
    { value: "category:asc", label: "Category" },
  ];

  const sortValue = `${sort.field}:${sort.direction}`;

  const handleSortChange = (value: string) => {
    const [field, direction] = value.split(":");
    onSortChange({
      field: field as SortParams["field"],
      direction: direction as SortParams["direction"],
    });
  };

  const handleCategoryChange = (value: string) => {
    onCategoryChange(value as Category | "all");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Track Tabs */}
      <div className="relative flex gap-6 border-b border-zinc-800">
        <button
          ref={(ref) => { tabRefs.current.all = ref; }}
          onClick={() => onTrackChange("all")}
          className={`pb-3 text-[14px] transition-colors ${
            track === "all" ? "text-white" : "text-[#9F9FA9] hover:text-white"
          }`}
        >
          All
        </button>
        <button
          ref={(ref) => { tabRefs.current.estimations = ref; }}
          onClick={() => onTrackChange("estimations")}
          className={`pb-3 text-[14px] transition-colors ${
            track === "estimations"
              ? "text-white"
              : "text-[#9F9FA9] hover:text-white"
          }`}
        >
          Estimations
        </button>
        <button
          ref={(ref) => { tabRefs.current.behaviorals = ref; }}
          onClick={() => onTrackChange("behaviorals")}
          className={`pb-3 text-[14px] transition-colors ${
            track === "behaviorals"
              ? "text-white"
              : "text-[#9F9FA9] hover:text-white"
          }`}
        >
          Behaviorals
        </button>
        <button
          ref={(ref) => { tabRefs.current.reasoning = ref; }}
          onClick={() => onTrackChange("reasoning")}
          className={`pb-3 text-[14px] transition-colors ${
            track === "reasoning"
              ? "text-white"
              : "text-[#9F9FA9] hover:text-white"
          }`}
        >
          Reasoning
        </button>

        {/* Animated indicator */}
        <div
          className="absolute bottom-0 h-0.5 bg-white transition-all duration-300 ease-out"
          style={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
          }}
        />
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Search and Sort */}
        <div className="flex items-center gap-3 flex-1 max-w-2xl">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-2.5 pl-11 pr-16 text-[14px] text-white placeholder-zinc-500 transition-colors focus:border-zinc-700 focus:outline-none hover:border-zinc-700"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-[12px] text-zinc-500">
              <span className="rounded bg-zinc-800 px-1.5 py-0.5">⌘</span>
              <span className="rounded bg-zinc-800 px-1.5 py-0.5">K</span>
            </div>
          </div>

          {/* Category Dropdown (only shown when track is selected) */}
          {track !== "all" && categories.length > 0 && (
            <Dropdown
              placeholder="Category"
              value={category}
              onChange={handleCategoryChange}
              options={categories}
            />
          )}

          {/* Sort Dropdown */}
          <Dropdown
            placeholder="Sort by"
            value={sortValue}
            onChange={handleSortChange}
            options={sortOptions}
          />
        </div>

      {/* Right side filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center rounded-full border border-zinc-800 bg-zinc-900/60 p-1 text-[12px] text-zinc-400">
          <button
            type="button"
            onClick={() => onViewChange("list")}
            className={`rounded-full px-3 py-1 transition-colors ${
              view === "list"
                ? "bg-white/10 text-white"
                : "text-zinc-400 hover:text-white"
            }`}
            aria-pressed={view === "list"}
          >
            List View
          </button>
          <button
            type="button"
            onClick={() => onViewChange("queue")}
            className={`rounded-full px-3 py-1 transition-colors ${
              view === "queue"
                ? "bg-white/10 text-white"
                : "text-zinc-400 hover:text-white"
            }`}
            aria-pressed={view === "queue"}
          >
            Queue View
          </button>
        </div>
        {/* Hide completed checkbox */}
        <label className="flex items-center gap-2 cursor-pointer group">
          <Checkbox
            checked={notDone}
              onChange={(e) => onNotDoneChange(e.target.checked)}
            />
            <span className="text-[14px] text-zinc-400 group-hover:text-zinc-300 transition-colors">
              Hide completed
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
