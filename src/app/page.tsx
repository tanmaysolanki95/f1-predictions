import Link from "next/link";
import RaceCountdown from "@/components/RaceCountdown";
import FallbackImage from "@/components/FallbackImage";
import { getCircuitImageUrl } from "@/lib/circuitImages";
import { createClient } from "@/lib/supabase/server";
import Card from "@/components/Card";
import Badge from "@/components/Badge";
import Button from "@/components/Button";

const TOTAL_ROUNDS = 22;

export default async function DashboardPage() {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: nextEvent } = await supabase
    .from("events")
    .select("*")
    .gte("date", today)
    .order("date", { ascending: true })
    .limit(1)
    .maybeSingle();

  const { data: pastEvents } = await supabase
    .from("events")
    .select("round")
    .lt("date", today)
    .order("round", { ascending: false })
    .limit(1)
    .maybeSingle();

  const completedRounds = pastEvents?.round ?? 0;

  const { data: leaders } = await supabase
    .from("leaderboard")
    .select("user_id, display_name, total_points")
    .order("total_points", { ascending: false })
    .limit(5);

  const nextEventStarted = nextEvent
    ? new Date(nextEvent.time ? `${nextEvent.date}T${nextEvent.time}` : `${nextEvent.date}T00:00:00Z`) <= new Date()
    : false;
  const nextEventLocked = nextEvent
    ? nextEvent.predictions_locked || nextEventStarted
    : false;

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="w-full racing-stripe-bg relative overflow-hidden">
        {(() => {
          const circuitUrl = nextEvent ? getCircuitImageUrl(nextEvent.circuit_id ?? "") : null;
          return circuitUrl ? (
            <FallbackImage src={circuitUrl} alt="" className="circuit-bg" />
          ) : null;
        })()}
        <div className="p-6 space-y-3 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {nextEvent?.is_sprint && (
                <Badge label="Sprint Weekend" tone="sprint" />
              )}
              {nextEventLocked && nextEvent && (
                <Badge label="Predictions Locked" tone="locked" />
              )}
            </div>
          </div>
          {nextEvent ? (
            <div className="space-y-3">
              <div style={{ fontFamily: 'var(--font-titillium)' }} className="text-4xl font-extrabold">
                {nextEvent.name}
              </div>
              <p style={{ fontFamily: 'var(--font-titillium)' }} className="text-sm text-[var(--muted)]">
                {nextEvent.circuit_name} &middot; {nextEvent.country}
              </p>
              <RaceCountdown targetDate={nextEvent.date} targetTime={nextEvent.time} />
              {nextEventLocked ? (
                <Button href={`/events/${nextEvent.id}/predictions`} variant="secondary" size="lg">
                  View Predictions
                </Button>
              ) : (
                <Button href={`/events/${nextEvent.id}/predict`} variant="primary" size="lg">
                  Make Predictions
                </Button>
              )}
            </div>
          ) : (
            <p className="text-[var(--muted)]">Season complete!</p>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
        <Card title="Season Progress">
          <div className="space-y-3">
            <p className="text-sm text-[var(--muted)]">
              Round {completedRounds} of {TOTAL_ROUNDS} completed
            </p>
            <div className="w-full h-2 bg-[var(--border)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--f1-red)] rounded-full transition-all"
                style={{ width: `${(completedRounds / TOTAL_ROUNDS) * 100}%` }}
              />
            </div>
            <p className="text-xs text-[var(--muted)]">
              {TOTAL_ROUNDS - completedRounds} rounds remaining
            </p>
          </div>
        </Card>

        <Card title="Leaderboard">
          {leaders && leaders.length > 0 ? (
            <div className="space-y-2">
              {leaders.map((entry, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm">
                    <span className="w-6 text-center" style={{ fontFamily: 'var(--font-titillium)' }}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                    </span>
                    <Link href={`/profile/${entry.user_id}`} className="hover:underline" style={{ fontFamily: 'var(--font-titillium)' }}>{entry.display_name}</Link>
                  </span>
                  <span className="text-sm font-mono text-[var(--muted)]">
                    {entry.total_points} pts
                  </span>
                </div>
              ))}
              <Link
                href="/leaderboard"
                className="block text-center text-sm text-[#E10600] hover:underline mt-2"
              >
                View Full Leaderboard →
              </Link>
            </div>
          ) : (
            <p className="text-sm text-[var(--muted)]">No scores yet — predictions start soon!</p>
          )}
        </Card>
      </div>

      <Card title="Quick Links">
        <div className="flex flex-col gap-3">
          <Button href="/events" variant="secondary" size="md">
            View All Events
          </Button>
          <Button href="/leaderboard" variant="secondary" size="md">
            Full Leaderboard
          </Button>
          <Button href="/results" variant="secondary" size="md">
            Latest Results
          </Button>
        </div>
      </Card>
    </div>
  );
}
