"use client";

import React, { useState } from "react";
import DataTable from "@/components/DataTable";

type ResultsTabsProps = {
  isSprint: boolean;
  raceHeaders: string[];
  raceRows: Array<Array<React.ReactNode>>;
  sprintHeaders: string[];
  sprintRows: Array<Array<React.ReactNode>>;
};

export default function ResultsTabs({
  isSprint,
  raceHeaders,
  raceRows,
  sprintHeaders,
  sprintRows,
}: ResultsTabsProps) {
  const [activeTab, setActiveTab] = useState<"race" | "sprint">("race");

  if (!isSprint) {
    return <DataTable headers={raceHeaders} rows={raceRows} />;
  }

  const isRaceActive = activeTab === "race";

  return (
    <div className="space-y-2">
      <div className="flex border-b border-[var(--glass-border)]">
        <button
          onClick={() => setActiveTab("race")}
          className="px-3 py-1.5 text-sm"
          style={{
            fontFamily: 'var(--font-titillium)',
            fontWeight: isRaceActive ? 600 : 400,
            borderBottom: isRaceActive ? "2px solid var(--f1-red)" : "2px solid transparent",
            color: isRaceActive ? "#fff" : "var(--muted)",
            transition: "colors 200ms",
          }}
        >
          Race
        </button>
        <button
          onClick={() => setActiveTab("sprint")}
          className="px-3 py-1.5 text-sm"
          style={{
            fontFamily: 'var(--font-titillium)',
            fontWeight: isRaceActive ? 400 : 600,
            borderBottom: !isRaceActive ? "2px solid var(--f1-red)" : "2px solid transparent",
            color: !isRaceActive ? "#fff" : "var(--muted)",
            transition: "colors 200ms",
          }}
        >
          Sprint
        </button>
      </div>
      <div key={activeTab} className="animate-fade-in">
        {isRaceActive ? (
          <DataTable headers={raceHeaders} rows={raceRows} />
        ) : (
          <DataTable headers={sprintHeaders} rows={sprintRows} />
        )}
      </div>
    </div>
  );
}
