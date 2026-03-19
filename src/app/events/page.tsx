import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import EventCard from "@/components/EventCard";
import Badge from "@/components/Badge";
import Card from "@/components/Card";
import Button from "@/components/Button";

export default async function EventsPage() {
  const supabase = await createClient();

  const { data: events, error } = await supabase
    .from("events")
    .select(
      "id, round, name, date, time, country, circuit_name, is_sprint, predictions_locked"
    )
    .eq("season_year", 2026)
    .order("round", { ascending: true });

  if (error) {
    return (
      <div className="p-6 text-red-500">
        Error loading events: {error.message}
      </div>
    );
  }

  const now = new Date();
  const today = now.toISOString().split("T")[0];

  return (
    <main className="p-6 text-[var(--muted)] animate-fade-in">
      <Card title="2026 Season">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(events ?? []).map((ev) => {
            const eventDate = new Date(ev.date);
            const isPast = eventDate < now;
            const hasBegun = ev.date <= today;
            const isLocked = ev.predictions_locked || hasBegun;
            const formattedDate = eventDate.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            });

            const statusBadge = isPast ? (
              <Link
                href={`/results?event=${ev.id}`}
                className="inline-block mt-2"
              >
                <Badge label="Completed" tone="points" />
              </Link>
            ) : hasBegun ? (
              <span className="inline-block mt-2">
                <Badge label="Event Started" tone="locked" />
              </span>
            ) : isLocked ? (
              <span className="inline-block mt-2">
                <Badge label="Locked" tone="locked" />
              </span>
            ) : (
              <span className="inline-block mt-2">
                <Badge label="Open" tone="open" />
              </span>
            );

            return (
              <div key={ev.id}>
                <Link href={isLocked ? `/events/${ev.id}/predictions` : `/events/${ev.id}/predict`} className="block">
                  <EventCard
                    raceName={ev.name}
                    date={formattedDate}
                    circuit={ev.circuit_name ?? ev.name}
                    countryFlag={ev.country}
                    sprint={!!ev.is_sprint}
                    round={ev.round}
                  />
                </Link>
                <div className="px-4 pb-3 flex items-center gap-2">
                  {statusBadge}
                  <Button variant="ghost" href={`/events/${ev.id}/predictions`}>
                    View Picks
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </main>
  );
}
