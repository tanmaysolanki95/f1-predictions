"use client";

import { useMemo, useState } from "react";
import Card from "@/components/Card";

type EventWithPicks = {
  event: {
    id: number;
    round: number;
    name: string;
    circuit_name: string;
    country: string;
    date: string;
    is_sprint: boolean;
  };
  prediction: {
    pole: string;
    p1: string;
    p2: string;
    p3: string;
    p10: string;
    sprintPole?: string;
    sprintP1?: string;
    sprintP2?: string;
    sprintP3?: string;
    sprintP10?: string;
  } | null;
  score: {
    total: number;
    racePoints: number;
    sprintPoints: number;
    breakdown: Record<string, number>;
  } | null;
};

type Props = {
  seasons: number[];
  currentSeason: number;
  seasonData: Record<number, EventWithPicks[]>;
  isOwnProfile: boolean;
};

type CategoryDef = {
  label: string;
  predKey: keyof NonNullable<EventWithPicks["prediction"]>;
  breakdownKey: string;
};

const RACE_CATEGORIES: CategoryDef[] = [
  { label: "Pole", predKey: "pole", breakdownKey: "pole" },
  { label: "P1", predKey: "p1", breakdownKey: "p1" },
  { label: "P2", predKey: "p2", breakdownKey: "p2" },
  { label: "P3", predKey: "p3", breakdownKey: "p3" },
  { label: "P10", predKey: "p10", breakdownKey: "p10" },
];

const SPRINT_CATEGORIES: CategoryDef[] = [
  { label: "Sprint Pole", predKey: "sprintPole", breakdownKey: "sprintPole" },
  { label: "Sprint P1", predKey: "sprintP1", breakdownKey: "sprintP1" },
  { label: "Sprint P2", predKey: "sprintP2", breakdownKey: "sprintP2" },
  { label: "Sprint P3", predKey: "sprintP3", breakdownKey: "sprintP3" },
  { label: "Sprint P10", predKey: "sprintP10", breakdownKey: "sprintP10" },
];

export default function ProfileTabs({ seasons, currentSeason, seasonData }: Props) {
  const [selectedSeason, setSelectedSeason] = useState<number>(currentSeason);

  const summary = useMemo(() => {
    const data = seasonData[selectedSeason] ?? [];
    const total = data.reduce((acc, e) => acc + (e.score?.total ?? 0), 0);
    const eventsPredicted = data.filter((e) => e.prediction !== null).length;
    const correct = data.reduce((acc, e) => {
      if (!e.score) return acc;
      return acc + Object.values(e.score.breakdown).filter((v) => v === 1).length;
    }, 0);
    return { total, eventsPredicted, correct };
  }, [selectedSeason, seasonData]);

  return (
    <section className="space-y-6">
      <div className="overflow-x-auto border-b border-[var(--glass-border)]">
        <div className="flex items-center gap-2 py-2 px-1">
          {seasons.map((yr) => (
            <button
              key={yr}
              onClick={() => setSelectedSeason(yr)}
              className="px-3 py-1.5 text-sm rounded-t-md transition-colors duration-200"
              style={{
                fontFamily: 'var(--font-titillium)',
                fontWeight: yr === selectedSeason ? 600 : 400,
                borderBottom: yr === selectedSeason ? '2px solid var(--f1-red)' : '2px solid transparent',
                color: yr === selectedSeason ? '#fff' : 'var(--muted)',
                whiteSpace: 'nowrap',
              }}
            >
              {yr}
            </button>
          ))}
        </div>
      </div>

      <Card title={`Season ${selectedSeason} Summary`}>
        <div className="grid grid-cols-3 gap-4">
          <div>Total points: <strong className="text-white">{summary.total}</strong></div>
          <div>Events predicted: <strong className="text-white">{summary.eventsPredicted}</strong></div>
          <div>Correct predictions: <strong className="text-white">{summary.correct}</strong></div>
        </div>
      </Card>

      <div key={selectedSeason} className="space-y-4 animate-fade-in">
        {(seasonData[selectedSeason] ?? []).length === 0 && (
          <Card>
            <p className="text-sm text-[var(--muted)] text-center py-6">No events for this season yet.</p>
          </Card>
        )}

        {(seasonData[selectedSeason] ?? []).map((ev) => {
          const { event: e, prediction: pred, score: sc } = ev;
          const categories = e.is_sprint ? [...RACE_CATEGORIES, ...SPRINT_CATEGORIES] : RACE_CATEGORIES;
          const maxPoints = e.is_sprint ? 10 : 5;

          return (
            <Card key={e.id} title={`R${e.round} — ${e.name}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white/70" style={{ fontFamily: 'var(--font-titillium)' }}>
                  {e.circuit_name}, {e.country}
                </span>
                <span className="text-sm text-white/70" style={{ fontFamily: 'var(--font-titillium)' }}>
                  {new Date(e.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>

              {e.is_sprint && (
                <span className="text-xs text-[var(--f1-red)]" style={{ fontFamily: 'var(--font-titillium)' }}>
                  Sprint weekend
                </span>
              )}

              {pred ? (
                <table className="w-full mt-2" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr className="border-b border-[var(--glass-border)]">
                      <th className="px-2 py-1 text-left text-xs text-[var(--muted)]" style={{ fontFamily: 'var(--font-titillium)' }}>Category</th>
                      <th className="px-2 py-1 text-left text-xs text-[var(--muted)]" style={{ fontFamily: 'var(--font-titillium)' }}>Pick</th>
                      <th className="px-2 py-1 text-left text-xs text-[var(--muted)]" style={{ fontFamily: 'var(--font-titillium)' }}>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((cat) => {
                      const pick = pred[cat.predKey] ?? "\u2014";
                      const scored = sc ? sc.breakdown[cat.breakdownKey] === 1 : null;
                      return (
                        <tr key={cat.breakdownKey} className="border-t border-[var(--glass-border)]">
                          <td className="px-2 py-1 text-sm" style={{ fontFamily: 'var(--font-titillium)' }}>{cat.label}</td>
                          <td className="px-2 py-1 text-sm" style={{ fontFamily: 'var(--font-titillium)' }}>{pick}</td>
                          <td className="px-2 py-1 text-sm">
                            {scored === null ? "\u2014" : scored ? <span className="text-green-400">✓</span> : <span className="text-red-400">✗</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-[var(--muted)] mt-2">No prediction</p>
              )}

              {sc && (
                <div className="mt-3 text-sm font-semibold" style={{ fontFamily: 'var(--font-titillium)' }}>
                  {sc.total}/{maxPoints} pts
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </section>
  );
}
