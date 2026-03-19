import { createClient } from "@/lib/supabase/server";
import DataTable from "@/components/DataTable";
import Card from "@/components/Card";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: standings, error } = await supabase
    .from("leaderboard")
    .select("user_id, display_name, total_points, events_scored, rank")
    .order("rank", { ascending: true });

  if (error) {
    return (
      <div className="p-6 text-red-500">
        Error loading leaderboard: {error.message}
      </div>
    );
  }

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
        {entry.display_name}
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
      <Card title="Season Leaderboard">
        <DataTable headers={headers} rows={rows} />
      </Card>
    </main>
  );
}
