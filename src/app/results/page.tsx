import { createClient } from "@/lib/supabase/server";
import Card from "@/components/Card";
import NavigableSelect from "@/components/NavigableSelect";
import { Suspense } from "react";
import ResultsTabs from "@/components/ResultsTabs";

export default async function ResultsPage({ searchParams }: { searchParams: Promise<{ event?: string }> }) {
  const { event } = (await searchParams) as { event?: string };
  const supabase = await createClient();

  const { data: completedEvents } = await supabase
    .from("events")
    .select("id, round, name, date, is_sprint")
    .eq("season_year", 2026)
    .lte("date", new Date().toISOString())
    .order("date", { ascending: false });

  if (!completedEvents || completedEvents.length === 0) {
    return (
      <main className="p-6 text-[var(--muted)] animate-fade-in">
        <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-titillium)' }}>Results</h2>
        <Card>
          <p className="text-white/70">No results available yet.</p>
        </Card>
      </main>
    );
  }

  const latestEvent = completedEvents[0];
  const selectedEventId = event ?? (latestEvent?.id ?? null);
  const eventInfo = completedEvents.find((ev) => ev.id === Number(selectedEventId)) ?? latestEvent;
  const isSprintWeekend = !!eventInfo?.is_sprint;

  if (!selectedEventId) {
    return (
      <main className="p-6 text-[var(--muted)] animate-fade-in">
        <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-titillium)' }}>Results</h2>
        <Card>
          <p className="text-white/70">No event selected.</p>
        </Card>
      </main>
    );
  }

  const eventId = Number(selectedEventId);

  const resultsPromise = supabase
    .from("session_results")
    .select("driver_id, position, session_type")
    .eq("event_id", eventId);
  const predictionsPromise = supabase.from("predictions").select("*").eq("event_id", eventId);
  const scoresPromise = supabase.from("scores").select(
    "user_id, race_pole_points, race_p1_points, race_p2_points, race_p3_points, race_p10_points, sprint_pole_points, sprint_p1_points, sprint_p2_points, sprint_p3_points, sprint_p10_points"
  ).eq("event_id", eventId);

  const [resultsData, predictionsData, scoresData] = await Promise.all([
    resultsPromise.then(r => r.data ?? []),
    predictionsPromise.then(r => r.data ?? []),
    scoresPromise.then(r => r.data ?? []),
  ]);

  const results = resultsData as Array<{ driver_id: string; position: number; session_type: string }>;
  const qualifyingResults = results.filter((r) => r.session_type === "qualifying");
  const raceResults = results.filter((r) => r.session_type === "race");
  const sprintResults = results.filter((r) => r.session_type === "sprint");

  const actualPole = qualifyingResults.find((r) => r.position === 1)?.driver_id;
  const raceTop3 = raceResults
    .filter((r) => r.position <= 3)
    .sort((a, b) => a.position - b.position)
    .map((r) => r.driver_id);
  const actualRaceP10 = raceResults.find((r) => r.position === 10)?.driver_id;

  let sprintTop3: string[] = [];
  let actualSprintP10: string | undefined;
  if (isSprintWeekend) {
    sprintTop3 = sprintResults
      .filter((r) => r.position <= 3)
      .sort((a, b) => a.position - b.position)
      .map((r) => r.driver_id);
    actualSprintP10 = sprintResults.find((r) => r.position === 10)?.driver_id;
  }

  const predictions = predictionsData as any[];
  const userIds = (predictions ?? []).map((p) => p.user_id);
  const { data: userNames } = await supabase
    .from("leaderboard")
    .select("user_id, display_name")
    .in("user_id", userIds);
  const nameMap = new Map((userNames ?? []).map((u) => [u.user_id, u.display_name]));

  const scoresMap = new Map<string, any>();
  (scoresData ?? []).forEach((s) => scoresMap.set(s.user_id, s));

  const check = (predicted: string | null | undefined, actual?: string) =>
    actual && predicted === actual ? "✅" : "✗";

  const raceHeaders = ["User", "Pole", "P1", "P2", "P3", "P10", "Points"];
  const raceRows = (predictions ?? []).map((p) => {
    const uid = p.user_id;
    const name = nameMap.get(uid) ?? uid;
    const s = scoresMap.get(uid);
    const racePoints = s
      ? (s.race_pole_points ?? 0) + (s.race_p1_points ?? 0) + (s.race_p2_points ?? 0) + (s.race_p3_points ?? 0) + (s.race_p10_points ?? 0)
      : 0;
    return [
      <span key="name" className="font-medium" style={{ fontFamily: 'var(--font-titillium)' }}>{name}</span>,
      <span key="pole" style={{ fontFamily: 'var(--font-titillium)' }}>{check(p.race_pole_driver_id, actualPole)}</span>,
      <span key="p1" style={{ fontFamily: 'var(--font-titillium)' }}>{check(p.race_p1_driver_id, raceTop3[0])}</span>,
      <span key="p2" style={{ fontFamily: 'var(--font-titillium)' }}>{check(p.race_p2_driver_id, raceTop3[1])}</span>,
      <span key="p3" style={{ fontFamily: 'var(--font-titillium)' }}>{check(p.race_p3_driver_id, raceTop3[2])}</span>,
      <span key="p10" style={{ fontFamily: 'var(--font-titillium)' }}>{check(p.race_p10_driver_id, actualRaceP10)}</span>,
      <span key="pts" className="font-semibold" style={{ fontFamily: 'var(--font-titillium)' }}>{racePoints}</span>,
    ];
  });

  const sprintHeaders = ["User", "Spr Pole", "Spr P1", "Points"];
  const sprintRows = (predictions ?? [])
    .map((p) => {
      if (!isSprintWeekend) return null;
      const uid = p.user_id;
      const name = nameMap.get(uid) ?? uid;
      const s = scoresMap.get(uid);
      const sprintPoints = s
        ? (s.sprint_pole_points ?? 0) + (s.sprint_p1_points ?? 0)
        : 0;
      return [
        <span key="name" className="font-medium" style={{ fontFamily: 'var(--font-titillium)' }}>{name}</span>,
        <span key="spole" style={{ fontFamily: 'var(--font-titillium)' }}>{check(p.sprint_pole_driver_id, actualPole)}</span>,
        <span key="sp1" style={{ fontFamily: 'var(--font-titillium)' }}>{check(p.sprint_p1_driver_id, sprintTop3[0])}</span>,
        <span key="pts" className="font-semibold" style={{ fontFamily: 'var(--font-titillium)' }}>{sprintPoints}</span>,
      ];
    })
    .filter((r) => r);

  const eventOptions = (completedEvents ?? []).map((ev) => ({ value: String(ev.id), label: `R${ev.round} — ${ev.name}` }));
  const selectedEventIdStr = String(selectedEventId ?? "");

  return (
    <main className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-titillium)' }}>Results</h1>
        <Suspense fallback={null}>
          <NavigableSelect
            paramName="event"
            options={eventOptions}
            value={selectedEventIdStr}
            className="min-w-[240px]"
          />
        </Suspense>
      </div>

      <ResultsTabs
        isSprint={isSprintWeekend}
        raceHeaders={raceHeaders}
        raceRows={raceRows}
        sprintHeaders={sprintHeaders}
        sprintRows={sprintRows as Array<Array<React.ReactNode>>}
      />
    </main>
  );
}
