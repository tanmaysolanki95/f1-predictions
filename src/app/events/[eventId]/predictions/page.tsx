import Card from "@/components/Card";
import Link from "next/link";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import DataTable from "@/components/DataTable";
import FallbackImage from "@/components/FallbackImage";
import { createClient } from "@/lib/supabase/server";
import { getCircuitImageUrl } from "@/lib/circuitImages";
import { getCountryFlagUrl } from "@/lib/countryFlags";
import type { Driver, Event, Prediction, Profile } from "@/types/database";

const VALID_BACK_PATHS = ["/", "/events", "/leaderboard"];

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { eventId } = await params;
  const { from } = await searchParams;
  const backHref = VALID_BACK_PATHS.includes(from ?? "") ? from! : "/events";
  const supabase = await createClient();
  
  const [
    { data: event },
    { data: predictions },
    { data: drivers },
    { data: profiles },
    { data: sessionResults },
    { data: scores },
    { data: { user } },
  ] = await Promise.all([
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
    supabase
      .from("session_results")
      .select("driver_id, position, session_type")
      .eq("event_id", Number(eventId)),
    supabase.from("scores").select("user_id, total_points").eq("event_id", Number(eventId)),
    supabase.auth.getUser(),
  ]);

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
    headers.push("Sprint Pole", "Spr P1");
  }

  
  const allSessionResults = (sessionResults ?? []) as Array<{
    driver_id: string;
    position: number;
    session_type: "qualifying" | "race" | "sprint";
  }>;
  const hasResults = allSessionResults.length > 0;
  if (hasResults) {
    headers.push("Pts");
  }

  const qualResults = allSessionResults.filter((r) => r.session_type === "qualifying");
  const raceResults = allSessionResults.filter((r) => r.session_type === "race");
  const sprintResults = allSessionResults.filter((r) => r.session_type === "sprint");

  const actualPole = qualResults.find((r) => r.position === 1)?.driver_id ?? null;
  const actualP1 = raceResults.find((r) => r.position === 1)?.driver_id ?? null;
  const actualP2 = raceResults.find((r) => r.position === 2)?.driver_id ?? null;
  const actualP3 = raceResults.find((r) => r.position === 3)?.driver_id ?? null;
  const actualP10 = raceResults.find((r) => r.position === 10)?.driver_id ?? null;
  const actualSprintPole = qualResults.find((r) => r.position === 1)?.driver_id ?? null;
  const actualSprintP1 = sprintResults.find((r) => r.position === 1)?.driver_id ?? null;

  
  const scoresMap = new Map<string, number>();
  for (const s of scores ?? []) {
    scoresMap.set(s.user_id, s.total_points);
  }

  const rows: Array<Array<React.ReactNode>> = [];
  for (const pred of predictions ?? []) {
    const displayName = profilesMap.get(pred.user_id) ?? pred.user_id;
    const isCurrentUser = user?.id === pred.user_id;

  const userCell = (
      <Link href={`/profile/${pred.user_id}`} className={`hover:underline ${isCurrentUser ? "font-bold text-[var(--f1-red)]" : ""}`}>
        {displayName}
      </Link>
    );

    const row: Array<React.ReactNode> = [
      userCell,
      resultCell(pred.race_pole_driver_id, actualPole, driversMap, hasResults),
      resultCell(pred.race_p1_driver_id, actualP1, driversMap, hasResults),
      resultCell(pred.race_p2_driver_id, actualP2, driversMap, hasResults),
      resultCell(pred.race_p3_driver_id, actualP3, driversMap, hasResults),
      resultCell(pred.race_p10_driver_id, actualP10, driversMap, hasResults),
    ];

    if (event.is_sprint) {
      row.push(
        resultCell(pred.sprint_pole_driver_id, actualSprintPole, driversMap, hasResults),
        resultCell(pred.sprint_p1_driver_id, actualSprintP1, driversMap, hasResults),
      );
    }

    
    if (hasResults) {
      const pts = scoresMap.get(pred.user_id);
      row.push(
        pts != null ? <span className="text-sm">{pts}</span> : <span className="text-sm">—</span>
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

  const circuitUrl = getCircuitImageUrl(event.circuit_id ?? "");
  const flagUrl = getCountryFlagUrl(event.country);

  
  function resultCell(
    driverId: string | null,
    actualId: string | null,
    map: Map<string, string>,
    show: boolean,
  ): React.ReactNode {
    const code = driverId ? (map.get(driverId) ?? "—") : "—";
    if (!show || !driverId) return code;
    const correct = driverId === actualId;
    return (
      <span className={correct ? "text-emerald-400 font-bold" : "text-white/40"}>
        {code} {correct ? "✓" : ""}
      </span>
    );
  }

  return (
    <div className="p-6 text-white animate-fade-in">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <Button variant="ghost" size="sm" href={backHref}>
          &larr; Back
        </Button>

        <Card className="w-full racing-stripe-bg relative overflow-hidden">
          {circuitUrl && (
            <FallbackImage src={circuitUrl} alt="" className="circuit-bg" />
          )}
          <div className="p-6 space-y-3 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className="inline-flex items-center justify-center min-w-[28px] h-7 px-1.5 rounded-full bg-[var(--f1-red)] text-white text-[0.65rem] font-extrabold leading-none flex-none"
                  style={{ fontFamily: "var(--font-titillium)" }}
                >
                  {`R${event.round}`}
                </span>
                <h1
                  className="text-2xl md:text-3xl font-extrabold"
                  style={{ fontFamily: "var(--font-titillium)" }}
                >
                  {event.name}
                </h1>
                {event.is_sprint && <Badge label="Sprint" tone="sprint" />}
              </div>
              {flagUrl && (
                <FallbackImage
                  src={flagUrl}
                  alt={event.country}
                  width={48}
                  height={32}
                  className="rounded-sm shadow-sm flex-none"
                />
              )}
            </div>
            <p
              className="text-sm text-[var(--muted)]"
              style={{ fontFamily: "var(--font-titillium)" }}
            >
              {event.circuit_name} &middot; {formattedDate}
            </p>
          </div>
        </Card>
        {hasResults && (
          <Card title="Actual Results">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {[
                { label: "Pole", driverId: actualPole },
                { label: "P1", driverId: actualP1 },
                { label: "P2", driverId: actualP2 },
                { label: "P3", driverId: actualP3 },
                { label: "P10", driverId: actualP10 },
              ].map(({ label, driverId }) => (
                <div key={label} className="text-center">
                  <p className="text-xs text-[var(--muted)] mb-1" style={{ fontFamily: "var(--font-titillium)" }}>{label}</p>
                  <p className="text-sm font-bold text-white" style={{ fontFamily: "var(--font-titillium)" }}>
                    {driverId ? (driversMap.get(driverId) ?? "—") : "—"}
                  </p>
                </div>
              ))}
            </div>
            {event.is_sprint && (
              <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-[var(--glass-border)]">
                {[
                  { label: "Sprint Pole", driverId: actualSprintPole },
                  { label: "Sprint P1", driverId: actualSprintP1 },
                ].map(({ label, driverId }) => (
                  <div key={label} className="text-center">
                    <p className="text-xs text-[var(--muted)] mb-1" style={{ fontFamily: "var(--font-titillium)" }}>{label}</p>
                    <p className="text-sm font-bold text-white" style={{ fontFamily: "var(--font-titillium)" }}>
                      {driverId ? (driversMap.get(driverId) ?? "—") : "—"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

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

        {!hasResults && user && (
          <div className="flex justify-end">
            <Button variant="primary" href={`/events/${eventId}/predict?edit`}>
              Make / Edit predictions
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
