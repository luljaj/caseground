"use client";

import { DonutChart } from "@tremor/react";

type TypeBreakdownProps = {
  estimations: number;
  behaviorals: number;
  reasoning: number;
};

export default function TypeBreakdownChart({
  estimations,
  behaviorals,
  reasoning,
}: TypeBreakdownProps) {
  const typeItems = [
    { name: "Estimations", value: estimations, color: "#60a5fa" },
    { name: "Behaviorals", value: behaviorals, color: "#a78bfa" },
    { name: "Reasoning", value: reasoning, color: "#fbbf24" },
  ].filter((item) => item.value > 0);

  const total = typeItems.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <div className="rounded-lg border border-border/80 bg-surface/30 p-8 transition-colors hover:bg-surface/40">
        <h3 className="text-xs font-medium uppercase tracking-wider text-text-secondary/60 mb-4">
          Questions by Type
        </h3>
        <p className="text-sm text-text-secondary">
          No questions attempted yet. Start practicing to see your breakdown!
        </p>
      </div>
    );
  }

  const chartData = typeItems.map(({ name, value }) => ({ name, value }));
  const chartColors = typeItems.map(({ color }) => color);

  return (
    <div className="rounded-lg border border-border/80 bg-surface/30 p-8 transition-colors hover:bg-surface/40">
      <h3 className="text-xs font-medium uppercase tracking-wider text-text-secondary/60 mb-6">
        Questions by Type
      </h3>
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:gap-8">
        <div className="flex items-center justify-center rounded-lg border border-white/5 bg-surface/40 p-5">
          <DonutChart
            data={chartData}
            category="value"
            index="name"
            colors={chartColors}
            showAnimation={true}
            showLabel={false}
            valueFormatter={(value) =>
              `${value} question${value !== 1 ? "s" : ""}`
            }
            className="h-32 w-32 md:h-36 md:w-36"
          />
        </div>
        <div className="flex flex-col gap-4">
          {typeItems.map((item) => (
            <div key={item.name} className="flex items-center gap-3">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-semibold text-text-primary">
                  {item.value}
                </span>
                <span className="text-sm text-text-secondary">{item.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
