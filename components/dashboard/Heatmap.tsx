"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils/cn";

type HeatmapDatum = {
  date: string;
  count: number;
};

export default function Heatmap({ data }: { data: HeatmapDatum[] }) {
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach((entry) => {
      map.set(entry.date, entry.count);
    });
    return map;
  }, [data]);

  const cells = useMemo(() => {
    const today = new Date();
    const start = new Date();
    start.setDate(today.getDate() - 364);

    return Array.from({ length: 365 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const dateKey = date.toISOString().slice(0, 10);
      const count = counts.get(dateKey) ?? 0;
      return {
        date,
        dateKey,
        count,
        week: Math.floor(index / 7),
        day: date.getDay(),
      };
    });
  }, [counts]);

  const colorForCount = (count: number) => {
    if (count >= 5) return "bg-accent";
    if (count >= 4) return "bg-accent/80";
    if (count >= 3) return "bg-accent/60";
    if (count >= 2) return "bg-accent/40";
    if (count >= 1) return "bg-accent/20";
    return "bg-border/40";
  };

  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">Activity</h3>
        <span className="text-xs text-text-secondary">Past 52 weeks</span>
      </div>
      <div
        className="mt-4 grid grid-rows-7 gap-1"
        style={{ gridTemplateColumns: "repeat(52, minmax(0, 1fr))" }}
      >
        {cells.map((cell) => (
          <div
            key={cell.dateKey}
            title={`${cell.date.toDateString()} - ${cell.count} submissions`}
            className={cn("h-3 w-3 rounded-sm", colorForCount(cell.count))}
            style={{
              gridColumnStart: cell.week + 1,
              gridRowStart: cell.day + 1,
            }}
          />
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs text-text-secondary">
        <span>Less</span>
        <div className="flex items-center gap-1">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className={cn(
                "h-3 w-3 rounded-sm",
                colorForCount(index)
              )}
            />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
