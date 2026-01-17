import { useState, useRef, useEffect } from "react";
import ProblemList from "./components/ProblemList";
import type { Question } from "./types";
import { Search } from "lucide-react";
import Checkbox from "./components/Checkbox";
import Dropdown from "./components/Dropdown";

// Mock data
const mockQuestions: Question[] = [
  { id: "1", number: 1, title: "Meal Kits", track: "estimations", category: "market-sizing" },
  { id: "2", number: 2, title: "Subway Rides", track: "estimations", category: "volume" },
  { id: "3", number: 3, title: "Coffee Shop", track: "estimations", category: "cost-revenue" },
  { id: "4", number: 4, title: "HR Software", track: "estimations", category: "market-sizing" },
  { id: "5", number: 5, title: "Owning Mistakes", track: "behaviorals", category: "easy" },
  { id: "6", number: 6, title: "Influence Without Authority", track: "behaviorals", category: "medium" },
  { id: "7", number: 7, title: "Leading Ambiguity", track: "behaviorals", category: "hard" },
  { id: "8", number: 8, title: "Light Switches", track: "reasoning", category: "logic" },
  { id: "9", number: 9, title: "Heavy Coin", track: "reasoning", category: "logic" },
  { id: "10", number: 10, title: "Lily Pad", track: "reasoning", category: "logic" },
  { id: "11", number: 11, title: "Inventory and Income Statement", track: "reasoning", category: "Financial Statements" },
  { id: "12", number: 12, title: "Debt-Funded Asset Purchase", track: "reasoning", category: "Financial Statements" },
  { id: "13", number: 13, title: "Interest and Depreciation Impact", track: "reasoning", category: "Financial Statements" },
  { id: "14", number: 14, title: "Asset Write-down and Debt Repayment", track: "reasoning", category: "Financial Statements" },
  { id: "15", number: 15, title: "Cash Inventory Purchase", track: "reasoning", category: "Financial Statements" },
  { id: "16", number: 16, title: "Sale of Inventory", track: "reasoning", category: "Financial Statements" },
  { id: "17", number: 17, title: "Negative Shareholders' Equity", track: "reasoning", category: "Financial Statements" },
  { id: "18", number: 18, title: "Working Capital Basics", track: "reasoning", category: "Financial Statements" },
  { id: "19", number: 19, title: "Negative Working Capital", track: "reasoning", category: "Financial Statements" },
  { id: "20", number: 20, title: "Asset Write-down Impact", track: "reasoning", category: "Financial Statements" },
  { id: "21", number: 21, title: "Government Bailout Impact", track: "reasoning", category: "Financial Statements" },
  { id: "22", number: 22, title: "Debt Write-down Impact", track: "reasoning", category: "Financial Statements" },
  { id: "23", number: 23, title: "Cash Collection Without Revenue", track: "reasoning", category: "Financial Statements" },
  { id: "24", number: 24, title: "Deferred Revenue Accounting", track: "reasoning", category: "Financial Statements" },
];

type TrackFilter = "all" | "estimations" | "behaviorals" | "reasoning";

export default function App() {
  const [completedIds] = useState<Set<string>>(new Set(["1", "5", "8"]));
  const [activeTrack, setActiveTrack] = useState<TrackFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [hideCompleted, setHideCompleted] = useState(false);
  const [sortBy, setSortBy] = useState("number");
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
    const activeButton = tabRefs.current[activeTrack];
    if (activeButton) {
      setIndicatorStyle({
        left: activeButton.offsetLeft,
        width: activeButton.offsetWidth,
      });
    }
  }, [activeTrack]);

  // Filter questions based on active filters
  const filteredQuestions = mockQuestions.filter((question) => {
    // Track filter
    if (activeTrack !== "all" && question.track !== activeTrack) {
      return false;
    }
    
    // Search filter
    if (searchQuery && !question.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Hide completed filter
    if (hideCompleted && completedIds.has(question.id)) {
      return false;
    }
    
    return true;
  });

  // Sort questions based on selected sort option
  const sortedQuestions = filteredQuestions.sort((a, b) => {
    if (sortBy === "number") {
      return a.number - b.number;
    }
    if (sortBy === "title") {
      return a.title.localeCompare(b.title);
    }
    if (sortBy === "track") {
      return a.track.localeCompare(b.track);
    }
    if (sortBy === "category") {
      return a.category.localeCompare(b.category);
    }
    return 0;
  });

  return (
    <div className="min-h-screen bg-black p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[32px] leading-[40px] text-white">Problems</h1>
          <p className="mt-2 text-[15px] text-[#9F9FA9]">
            Practice cases across estimations, behaviorals, and technical reasoning.
          </p>
        </div>

        {/* Track Tabs */}
        <div className="mb-6 relative flex gap-6 border-b border-zinc-800">
          <button
            ref={(ref) => (tabRefs.current.all = ref)}
            onClick={() => setActiveTrack("all")}
            className={`pb-3 text-[14px] transition-colors ${
              activeTrack === "all"
                ? "text-white"
                : "text-[#9F9FA9] hover:text-white"
            }`}
          >
            All
          </button>
          <button
            ref={(ref) => (tabRefs.current.estimations = ref)}
            onClick={() => setActiveTrack("estimations")}
            className={`pb-3 text-[14px] transition-colors ${
              activeTrack === "estimations"
                ? "text-white"
                : "text-[#9F9FA9] hover:text-white"
            }`}
          >
            Estimations
          </button>
          <button
            ref={(ref) => (tabRefs.current.behaviorals = ref)}
            onClick={() => setActiveTrack("behaviorals")}
            className={`pb-3 text-[14px] transition-colors ${
              activeTrack === "behaviorals"
                ? "text-white"
                : "text-[#9F9FA9] hover:text-white"
            }`}
          >
            Behaviorals
          </button>
          <button
            ref={(ref) => (tabRefs.current.reasoning = ref)}
            onClick={() => setActiveTrack("reasoning")}
            className={`pb-3 text-[14px] transition-colors ${
              activeTrack === "reasoning"
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
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Search and Sort */}
          <div className="flex items-center gap-3 flex-1 max-w-2xl">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-2.5 pl-11 pr-16 text-[14px] text-white placeholder-zinc-500 transition-colors focus:border-zinc-700 focus:outline-none hover:border-zinc-700"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-[12px] text-zinc-500">
                <span className="rounded bg-zinc-800 px-1.5 py-0.5">⌘</span>
                <span className="rounded bg-zinc-800 px-1.5 py-0.5">K</span>
              </div>
            </div>

            {/* Sort Dropdown */}
            <Dropdown
              placeholder="Sort by"
              value={sortBy}
              onChange={setSortBy}
              options={[
                { value: "number", label: "Number" },
                { value: "title", label: "Title" },
                { value: "track", label: "Track" },
                { value: "category", label: "Category" },
              ]}
            />
          </div>

          {/* Right side filters */}
          <div className="flex items-center gap-4">
            {/* Hide completed checkbox */}
            <Checkbox
              label="Hide completed"
              checked={hideCompleted}
              onChange={setHideCompleted}
            />
          </div>
        </div>

        <ProblemList questions={sortedQuestions} completedIds={completedIds} />
      </div>
    </div>
  );
}