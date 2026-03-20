import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import EventCard from "@/components/EventCard";
import Badge from "@/components/Badge";
import Card from "@/components/Card";
import Button from "@/components/Button";

export default async function EventsPage() {
  const supabase = await createClient();

  const [{ data: events, error }, { data: { user } }] = await Promise.all([
    supabase
      .from("events")
      .select(
        "id, round, name, date, time, country, circuit_name, circuit_id, is_sprint, predictions_locked"
      )
      .eq("season_year", 2026)
      .order("round", { ascending: true }),
    supabase.auth.getUser(),
  ]);

  if (error) {
    return (
      <div className="p-6 text-red-500">
        Error loading events: {error.message}
      </div>
    );
  }

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  let nextAssigned = false;

  return (
    <main className="p-6 text-[var(--muted)] animate-fade-in">
      <Button variant="ghost" size="sm" href="/?from=/events" className="mb-4">
        &larr; Back
      </Button>
      <Card title="2026 Season">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(events ?? []).map((ev) => {
            const eventDate = new Date(ev.date);
            const isPast = eventDate < now;
            const isNext = !nextAssigned && ev.date >= today;
            if (isNext) nextAssigned = true;
            const hasBegun = ev.date <= today;
            const isLocked = ev.predictions_locked || hasBegun;
            const formattedDate = eventDate.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            });

            const statusBadge = isPast ? (
              <Badge label="Completed" tone="points" />
            ) : hasBegun ? (
              <Badge label="Event Started" tone="locked" />
            ) : isLocked ? (
              <Badge label="Locked" tone="locked" />
            ) : (
              <Badge label="Open" tone="open" />
            );

            const predictionsHref = `/events/${ev.id}/predictions?from=/events`;
            const predictHref = `/events/${ev.id}/predict`;
            const canPredict = user && !isPast && !isLocked;
            const cardHref = canPredict ? predictHref : predictionsHref;

            return (
              <div key={ev.id} className="flex flex-col">
                <Link href={cardHref} className="block flex-1">
                  <EventCard
                    raceName={ev.name}
                    date={formattedDate}
                    circuit={ev.circuit_name ?? ev.name}
                    countryFlag={ev.country}
                    sprint={!!ev.is_sprint}
                    round={ev.round}
                    isPast={isPast}
                    isNext={isNext}
                  />
                </Link>
                <div className="px-4 pb-3 flex items-center gap-2 flex-wrap">
                  {statusBadge}
                  {!isPast && (
                    <Button variant="ghost" href={canPredict ? predictHref : predictionsHref}>
                      View Event
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </main>
  );
}
