import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import DataTable from "@/components/DataTable";
import Card from "@/components/Card";
import NavigableSelect from "@/components/NavigableSelect";
import { Suspense } from "react";

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string }>;
}) {
  const supabase = await createClient();
  const { season } = await searchParams;

  const [{ data: { user } }, { data: seasons }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("seasons").select("year").order("year", { ascending: false }),
  ]);

  const seasonOptions = (seasons ?? []).map((s) => ({ value: String(s.year), label: `${s.year} Season` }));

  const latestSeason = (seasons ?? [])[0]?.year;
  const selectedSeason = (season && seasonOptions.find((opt) => opt.value === season))
    ? Number(season)
    : latestSeason ?? null;

  if ((seasons ?? []).length === 0) {
    return (
      <main className="p-6 text-[var(--muted)] animate-fade-in">
        <div className="text-sm text-gray-500">No seasons available yet.</div>
      </main>
    );
  }

  const seasonYear = selectedSeason ?? (seasons?.[0]?.year ?? null);
  if (seasonYear == null) {
    return (
      <main className="p-6 text-[var(--muted)] animate-fade-in">
        <div className="text-sm text-gray-500">No seasons available yet.</div>
      </main>
    );
  }

  const [{ data: seasonEvents }, { data: profiles }] = await Promise.all([
    supabase.from("events").select("id").eq("season_year", seasonYear),
    supabase.from("profiles").select("id, display_name"),
  ]);
  const eventIds = (seasonEvents ?? []).map((e) => e.id);

  const { data: scores } = await supabase
    .from("scores")
    .select("user_id, total_points, event_id")
    .in("event_id", eventIds);

  // Aggregate points per user for the selected season
  const userPoints = new Map<string, { total: number; events: Set<number> }>();
  for (const s of scores ?? []) {
    const entry = userPoints.get(s.user_id) ?? { total: 0, events: new Set<number>() };
    entry.total += s.total_points ?? 0;
    entry.events.add(s.event_id);
    userPoints.set(s.user_id, entry);
  }

  const standings = (profiles ?? [])
    .map((p) => ({
      user_id: p.id,
      display_name: p.display_name,
      total_points: userPoints.get(p.id)?.total ?? 0,
      events_scored: userPoints.get(p.id)?.events.size ?? 0,
    }))
    .sort((a, b) => b.total_points - a.total_points)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));

  const headers = ["Rank", "Name", "Points", "Events"];
  const rows = (standings ?? []).map((entry) => {
    const isCurrentUser = user?.id === entry.user_id;
    const trophy = entry.rank <= 3 ? " 🏆" : "";

    return [
      <span
        key="rank"
        className={isCurrentUser ? "font-black text-[var(--f1-red)]" : ""}
        style={{ fontFamily: 'var(--font-titillium)', fontWeight: 900 }}
      >
        {entry.rank}
        {trophy}
      </span>,
      <span
        key="name"
        className={isCurrentUser ? "font-bold text-[var(--f1-red)]" : ""}
        style={{ fontFamily: 'var(--font-titillium)' }}
      >
        <Link href={`/profile/${entry.user_id}`} className={"hover:underline"}>{entry.display_name}</Link>
        {isCurrentUser ? " (you)" : ""}
      </span>,
      <span
        key="pts"
        className={isCurrentUser ? "font-bold text-[var(--f1-red)]" : ""}
        style={{ fontFamily: 'var(--font-titillium)' }}
      >
        {entry.total_points}
      </span>,
      <span
        key="ev"
        className={isCurrentUser ? "font-bold text-[var(--f1-red)]" : ""}
        style={{ fontFamily: 'var(--font-titillium)' }}
      >
        {entry.events_scored}
      </span>,
    ];
  });

  return (
    <main className="p-6 text-[var(--muted)] animate-fade-in">
      <div className="mb-4 flex items-center gap-4">
        <Suspense fallback={null}>
          <NavigableSelect
            paramName="season"
            options={seasonOptions}
            value={String(seasonYear)}
          />
        </Suspense>
      </div>
      <Card title="Season Leaderboard">
        <DataTable headers={headers} rows={rows} />
      </Card>
    </main>
  );
}
