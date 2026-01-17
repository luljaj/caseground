"use client";

import { DonutChart, Card } from "@tremor/react";

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
  const total = estimations + behaviorals + reasoning;

  // Handle empty state
  if (total === 0) {
    return (
      <Card className="border-border bg-surface/40 p-8 rounded-lg ring-0 focus:ring-0 focus-visible:ring-0">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Questions by Type
        </h3>
        <p className="text-sm text-text-secondary">
          No questions attempted yet. Start practicing to see your breakdown!
        </p>
      </Card>
    );
  }

  const chartData = [
    { name: "Estimations", value: estimations },
    { name: "Behaviorals", value: behaviorals },
    { name: "Reasoning", value: reasoning },
  ].filter((item) => item.value > 0); // Only show types with data

  return (
    <Card className="border-border bg-surface/40 p-8 rounded-lg ring-0 focus:ring-0 focus-visible:ring-0">
      <h3 className="text-lg font-semibold text-text-primary mb-6">
        Questions by Type
      </h3>
      <div className="flex items-center gap-6">
        <div className="border border-border rounded-lg p-4 bg-background/20">
          <DonutChart
            data={chartData}
            category="value"
            index="name"
            colors={["#60a5fa", "#a78bfa", "#fbbf24"]}
            showAnimation={true}
            showLabel={false}
            valueFormatter={(value) => `${value} question${value !== 1 ? "s" : ""}`}
            className="h-32 w-32"
          />
        </div>
        {/* Legend */}
        <div className="flex flex-col gap-3">
          {estimations > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-400" />
              <div className="text-sm">
                <span className="text-text-primary font-medium">
                  {estimations}
                </span>{" "}
                <span className="text-text-secondary">Estimations</span>
              </div>
            </div>
          )}
          {behaviorals > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-violet-400" />
              <div className="text-sm">
                <span className="text-text-primary font-medium">
                  {behaviorals}
                </span>{" "}
                <span className="text-text-secondary">Behaviorals</span>
              </div>
            </div>
          )}
          {reasoning > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="text-sm">
                <span className="text-text-primary font-medium">
                  {reasoning}
                </span>{" "}
                <span className="text-text-secondary">Reasoning</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
