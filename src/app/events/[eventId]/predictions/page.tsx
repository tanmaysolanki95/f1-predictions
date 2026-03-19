import Card from "@/components/Card";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import DataTable from "@/components/DataTable";
import { createClient } from "@/lib/supabase/server";
import type { Driver, Event, Prediction, Profile } from "@/types/database";

function driverCode(
  driverId: string | null,
  driversMap: Map<string, string>,
): string {
  if (!driverId) return "\u2014";
  return driversMap.get(driverId) ?? "\u2014";
}

export default async function Page({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const supabase = await createClient();

  const [{ data: event }, { data: predictions }, { data: drivers }, { data: profiles }] =
    await Promise.all([
      supabase
        .from("events")
        .select("*")
        .eq("id", Number(eventId))
        .single<Event>(),
      supabase
        .from("predictions")
        .select("*")
        .eq("event_id", Number(eventId))
        .returns<Prediction[]>(),
      supabase.from("drivers").select("id, code").returns<Pick<Driver, "id" | "code">[]>(),
      supabase.from("profiles").select("id, display_name").returns<Pick<Profile, "id" | "display_name">[]>(),
    ]);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!event) {
    return (
      <div className="flex items-center justify-center text-white h-64">
        Event not found.
      </div>
    );
  }

  const driversMap = new Map<string, string>();
  for (const d of drivers ?? []) {
    driversMap.set(d.id, d.code);
  }

  const profilesMap = new Map<string, string>();
  for (const p of profiles ?? []) {
    profilesMap.set(p.id, p.display_name);
  }

  const headers = ["User", "Pole", "P1", "P2", "P3", "P10"];
  if (event.is_sprint) {
    headers.push("Sprint Pole", "Spr P1", "Spr P2", "Spr P3", "Spr P10");
  }

  const rows: Array<Array<React.ReactNode>> = [];
  for (const pred of predictions ?? []) {
    const displayName = profilesMap.get(pred.user_id) ?? pred.user_id;
    const isCurrentUser = user?.id === pred.user_id;

    const userCell = (
      <span className={isCurrentUser ? "font-bold text-[var(--f1-red)]" : ""}>
        {displayName}
      </span>
    );

    const row: Array<React.ReactNode> = [
      userCell,
      driverCode(pred.race_pole_driver_id, driversMap),
      driverCode(pred.race_p1_driver_id, driversMap),
      driverCode(pred.race_p2_driver_id, driversMap),
      driverCode(pred.race_p3_driver_id, driversMap),
      driverCode(pred.race_p10_driver_id, driversMap),
    ];

    if (event.is_sprint) {
      row.push(
        driverCode(pred.sprint_pole_driver_id, driversMap),
        driverCode(pred.sprint_p1_driver_id, driversMap),
        driverCode(pred.sprint_p2_driver_id, driversMap),
        driverCode(pred.sprint_p3_driver_id, driversMap),
        driverCode(pred.sprint_p10_driver_id, driversMap),
      );
    }

    rows.push(row);
  }

  const isEmpty = !predictions || predictions.length === 0;
  const formattedDate = new Date(event.date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="p-6 text-white animate-fade-in">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <Button variant="ghost" size="sm" href={`/events/${eventId}`}>
          &larr; Back to event
        </Button>

        <header className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-titillium)' }}>{event.name}</h1>
            {event.is_sprint && <Badge label="Sprint" tone="sprint" />}
          </div>
          <p className="text-sm text-[var(--muted)]">
            Round {event.round} &middot; {formattedDate} &middot;{" "}
            {event.circuit_name}
          </p>
        </header>

        {isEmpty ? (
          <Card>
            <p className="text-center text-[var(--muted)] py-8">
              No predictions yet
            </p>
          </Card>
        ) : (
          <Card title="Predictions">
            <DataTable headers={headers} rows={rows} />
          </Card>
        )}

        <div className="flex justify-end">
          <Button variant="primary" href={`/events/${eventId}/predict`}>
            Make / Edit predictions
          </Button>
        </div>
      </div>
    </div>
  );
}
