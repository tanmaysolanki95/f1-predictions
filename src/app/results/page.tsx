import { createClient } from "@/lib/supabase/server";
import DataTable from "@/components/DataTable";
import Card from "@/components/Card";

export default async function ResultsPage() {
  const supabase = await createClient();

  const { data: completedEvents } = await supabase
    .from("events")
    .select("id, round, name, date, is_sprint")
    .eq("season_year", 2026)
    .lte("date", new Date().toISOString())
    .order("date", { ascending: false })
    .limit(1);

  const latestEvent = completedEvents?.[0] ?? null;

  if (!latestEvent) {
    return (
      <main className="p-6 text-[var(--muted)] animate-fade-in">
        <Card title="Latest Results">
          <p className="text-white/70">No results available yet.</p>
        </Card>
      </main>
    );
  }

  const eventId = latestEvent.id;
  const isSprint = !!latestEvent.is_sprint;

  const [poleResult, raceTopResult, raceP10Result, sprintTopResult, sprintP10Result, predictionsResult, scoresResult] =
    await Promise.all([
      supabase
        .from("session_results")
        .select("driver_id")
        .eq("event_id", eventId)
        .eq("session_type", "qualifying")
        .order("position", { ascending: true })
        .limit(1),
      supabase
        .from("session_results")
        .select("driver_id, position")
        .eq("event_id", eventId)
        .eq("session_type", "race")
        .order("position", { ascending: true })
        .limit(10),
      supabase
        .from("session_results")
        .select("driver_id")
        .eq("event_id", eventId)
        .eq("session_type", "race")
        .eq("position", 10)
        .limit(1),
      isSprint
        ? supabase
            .from("session_results")
            .select("driver_id, position")
            .eq("event_id", eventId)
            .eq("session_type", "sprint")
            .order("position", { ascending: true })
            .limit(10)
        : Promise.resolve({ data: null }),
      isSprint
        ? supabase
            .from("session_results")
            .select("driver_id")
            .eq("event_id", eventId)
            .eq("session_type", "sprint")
            .eq("position", 10)
            .limit(1)
        : Promise.resolve({ data: null }),
      supabase
        .from("predictions")
        .select("*")
        .eq("event_id", eventId),
      supabase
        .from("scores")
        .select("user_id, total_points")
        .eq("event_id", eventId),
    ]);

  const actualPole = poleResult.data?.[0]?.driver_id;
  const raceTop3 = (raceTopResult.data ?? [])
    .filter((r) => r.position <= 3)
    .map((r) => r.driver_id);
  const actualRaceP10 = raceP10Result.data?.[0]?.driver_id;
  const sprintTop3 = (sprintTopResult.data ?? [])
    .filter((r) => r.position <= 3)
    .map((r) => r.driver_id);
  const actualSprintP10 = sprintP10Result.data?.[0]?.driver_id;

  const predictions = predictionsResult.data ?? [];
  const scoresMap = new Map(
    (scoresResult.data ?? []).map((s) => [s.user_id, s.total_points])
  );

  if (predictions.length === 0) {
    return (
      <main className="p-6 text-[var(--muted)] animate-fade-in">
        <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'var(--font-titillium)' }}>
          Results — Round {latestEvent.round}: {latestEvent.name}
        </h2>
        <Card>
          <p className="text-white/70">No results available yet.</p>
        </Card>
      </main>
    );
  }

  const userIds = predictions.map((p) => p.user_id);
  const { data: userNames } = await supabase
    .from("leaderboard")
    .select("user_id, display_name")
    .in("user_id", userIds);

  const nameMap = new Map(
    (userNames ?? []).map((u) => [u.user_id, u.display_name])
  );

  const check = (predicted: string | null, actual: string | undefined) =>
    actual && predicted === actual ? "✅" : "❌";

  const baseHeaders = ["User", "Pole", "P1", "P2", "P3", "P10"];
  const sprintHeaders = isSprint
    ? ["Spr P1", "Spr P2", "Spr P3", "Spr P10"]
    : [];
  const headers = [...baseHeaders, ...sprintHeaders, "Points"];

  const rows = predictions.map((p) => {
    const name = nameMap.get(p.user_id) ?? p.user_id;
    const points = scoresMap.get(p.user_id) ?? 0;

    const baseCells = [
      <span key="name" className="font-medium">{name}</span>,
      check(p.race_pole_driver_id, actualPole),
      check(p.race_p1_driver_id, raceTop3[0]),
      check(p.race_p2_driver_id, raceTop3[1]),
      check(p.race_p3_driver_id, raceTop3[2]),
      check(p.race_p10_driver_id, actualRaceP10),
    ];

    const sprintCells = isSprint
      ? [
          check(p.sprint_p1_driver_id, sprintTop3[0]),
          check(p.sprint_p2_driver_id, sprintTop3[1]),
          check(p.sprint_p3_driver_id, sprintTop3[2]),
          check(p.sprint_p10_driver_id, actualSprintP10),
        ]
      : [];

    return [
      ...baseCells,
      ...sprintCells,
      <span key="pts" className="font-semibold text-[var(--f1-red)]">{points}</span>,
    ];
  });

  return (
    <main className="p-6 text-[var(--muted)] animate-fade-in space-y-4">
      <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-titillium)' }}>
        Results — Round {latestEvent.round}: {latestEvent.name}
      </h2>
      <Card>
        <DataTable headers={headers} rows={rows} />
      </Card>
    </main>
  );
}
