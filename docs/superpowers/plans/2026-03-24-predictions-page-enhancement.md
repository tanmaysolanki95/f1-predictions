# Predictions Page Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance the event detail page to show a race weekend schedule with local-timezone times, driver headshot cards for actual results, and team color dots in the predictions table; move the route from `/events/[eventId]/predictions` to `/events/[eventId]`.

**Architecture:** A new `SessionSchedule` client component handles timezone detection and session rendering. The existing predictions page gains richer data queries and replaces its flat results grid with driver cards. The route is then moved to the event root and all inbound links updated.

**Tech Stack:** Next.js 16 App Router, React 19 Server Components, Supabase JS v2, Tailwind CSS 4, TypeScript.

---

## File Map

| File | Action |
|------|--------|
| `src/components/SessionSchedule.tsx` | Create — client component for weekend schedule |
| `src/app/events/[eventId]/page.tsx` | Create — new event detail page (enhanced version of predictions page) |
| `src/app/events/[eventId]/loading.tsx` | Create — loading skeleton for the new route |
| `src/app/events/[eventId]/predictions/page.tsx` | Delete in Task 3 |
| `src/app/events/[eventId]/predictions/loading.tsx` | Delete in Task 3 |
| `src/app/page.tsx` | Modify — 3 link updates |
| `src/app/events/page.tsx` | Modify — 1 link update |
| `src/app/events/[eventId]/predict/page.tsx` | Modify — 1 redirect update |
| `src/app/events/[eventId]/predict/PredictionForm.tsx` | Modify — 1 router.push update |

---

## Task 1: Create `SessionSchedule` client component

**Files:**
- Create: `src/components/SessionSchedule.tsx`

- [ ] **Step 1: Create the file**

```tsx
"use client";

import Card from "@/components/Card";
import type { EventSession } from "@/types/database";

interface Props {
  sessions: Pick<EventSession, "session_type" | "date" | "time">[];
}

const SESSION_META: Record<
  EventSession["session_type"],
  { badge: string; name: string; tint: "red" | "blue" | "none" }
> = {
  fp1: { badge: "FP1", name: "Practice 1", tint: "none" },
  fp2: { badge: "FP2", name: "Practice 2", tint: "none" },
  fp3: { badge: "FP3", name: "Practice 3", tint: "none" },
  sprint_qualifying: { badge: "SQ", name: "Sprint Qualifying", tint: "none" },
  sprint_race: { badge: "SR", name: "Sprint Race", tint: "none" },
  qualifying: { badge: "QUALI", name: "Qualifying", tint: "blue" },
  race: { badge: "RACE", name: "Grand Prix", tint: "red" },
};

export default function SessionSchedule({ sessions }: Props) {
  if (sessions.length === 0) return null;

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const sorted = [...sessions].sort((a, b) => {
    return (
      new Date(`${a.date}T${a.time}`).getTime() -
      new Date(`${b.date}T${b.time}`).getTime()
    );
  });

  const timeFormatter = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: tz,
  });

  const dayFormatter = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    timeZone: tz,
  });

  const dateNumFormatter = new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    timeZone: tz,
  });

  // Track last rendered day to group sessions
  let lastDayKey = "";

  return (
    <Card title="Weekend Schedule">
      <div>
        {sorted.map((session, i) => {
          const dt = new Date(`${session.date}T${session.time}`);
          const dayKey = dt.toLocaleDateString(undefined, {
            timeZone: tz,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          });
          const isNewDay = dayKey !== lastDayKey;
          lastDayKey = dayKey;

          const meta = SESSION_META[session.session_type] ?? {
            badge: session.session_type.toUpperCase(),
            name: session.session_type,
            tint: "none" as const,
          };

          const rowBg =
            meta.tint === "red"
              ? "bg-[var(--f1-red)]/5"
              : meta.tint === "blue"
              ? "bg-blue-500/5"
              : "";

          const badgeCls =
            meta.tint === "red"
              ? "bg-[var(--f1-red)]/20 text-[var(--f1-red)] border border-[var(--f1-red)]/30"
              : meta.tint === "blue"
              ? "bg-blue-500/15 text-blue-400 border border-blue-500/25"
              : "bg-[var(--f1-red)]/15 text-[var(--f1-red)] border border-[var(--f1-red)]/20";

          return (
            <div
              key={i}
              className={`flex items-center gap-3 px-1 py-3 ${
                i > 0 ? "border-t border-[var(--glass-border)]" : ""
              } ${rowBg}`}
            >
              {/* Day column — 52px, only populated on first session of each day */}
              <div className="w-[52px] flex-none text-center">
                {isNewDay && (
                  <>
                    <p className="text-[0.6rem] text-[var(--muted)] uppercase tracking-widest leading-none">
                      {dayFormatter.format(dt)}
                    </p>
                    <p
                      className={`text-lg font-extrabold leading-none mt-0.5 ${
                        meta.tint === "red" ? "text-[var(--f1-red)]" : "text-white"
                      }`}
                      style={{ fontFamily: "var(--font-titillium)" }}
                    >
                      {dateNumFormatter.format(dt)}
                    </p>
                  </>
                )}
              </div>

              {/* Session badge */}
              <span
                className={`text-[0.6rem] font-bold tracking-widest px-1.5 py-0.5 rounded flex-none ${badgeCls}`}
                style={{ fontFamily: "var(--font-titillium)" }}
              >
                {meta.badge}
              </span>

              {/* Full session name */}
              <span className="flex-1 text-sm text-[var(--text)]">{meta.name}</span>

              {/* Local time */}
              <span
                className={`text-sm font-mono flex-none ${
                  meta.tint === "red"
                    ? "text-[var(--f1-red)] font-bold"
                    : "text-[var(--muted)]"
                }`}
              >
                {timeFormatter.format(dt)}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```

Expected: no TypeScript or compilation errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/SessionSchedule.tsx
git commit -m "feat: add SessionSchedule client component"
```

---

## Task 2: Create enhanced event detail page at `/events/[eventId]`

**Files:**
- Create: `src/app/events/[eventId]/page.tsx`

This is a new file alongside the existing `predictions/page.tsx`. Both routes will coexist until Task 3 cleans up the old one. The new file incorporates all data query expansions, the `DriverInfo` map, driver cards, team color dots, and the `SessionSchedule` component.

- [ ] **Step 1: Create `src/app/events/[eventId]/page.tsx`**

```tsx
import Card from "@/components/Card";
import Link from "next/link";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import DataTable from "@/components/DataTable";
import FallbackImage from "@/components/FallbackImage";
import SessionSchedule from "@/components/SessionSchedule";
import { createClient } from "@/lib/supabase/server";
import { getCircuitImageUrl } from "@/lib/circuitImages";
import { getCountryFlagUrl } from "@/lib/countryFlags";
import type { Driver, Event, EventSession, Prediction, Profile } from "@/types/database";

type DriverInfo = { code: string; teamColour: string | null; headshotUrl: string | null };

const VALID_BACK_PATHS = ["/", "/events", "/leaderboard"];

// Renders a circular driver avatar.
// If headshotUrl is null, renders a team-color gradient circle with code text.
// If headshotUrl is provided but fails to load, FallbackImage falls back to the circle.
function DriverAvatar({
  headshotUrl,
  code,
  teamColour,
}: {
  headshotUrl: string | null;
  code: string;
  teamColour: string | null;
}) {
  const circle = (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center mx-auto text-[0.65rem] font-extrabold text-white"
      style={{
        background: teamColour
          ? `linear-gradient(135deg, #${teamColour}cc, #${teamColour}55)`
          : "var(--surface-elevated)",
      }}
    >
      {code}
    </div>
  );

  if (!headshotUrl) return circle;

  return (
    <FallbackImage
      src={headshotUrl}
      alt={code}
      width={36}
      height={36}
      className="w-9 h-9 rounded-full mx-auto object-cover"
      fallback={circle}
    />
  );
}

// A single driver result card: team color bar + avatar + position label + code.
function DriverResultCard({
  label,
  driverId,
  driversMap,
}: {
  label: string;
  driverId: string | null;
  driversMap: Map<string, DriverInfo>;
}) {
  const info = driverId ? driversMap.get(driverId) : null;
  const code = info?.code ?? "—";
  const teamColour = info?.teamColour ?? null;
  const headshotUrl = info?.headshotUrl ?? null;

  return (
    <div className="text-center bg-[var(--glass)] border border-[var(--glass-border)] rounded-[var(--radius-md)] overflow-hidden">
      <div
        className="h-[3px]"
        style={{ background: teamColour ? `#${teamColour}` : "var(--border)" }}
      />
      <div className="p-2 pt-3 pb-3 space-y-1.5">
        <DriverAvatar headshotUrl={headshotUrl} code={code} teamColour={teamColour} />
        <p
          className="text-[0.6rem] text-[var(--muted)] uppercase tracking-wider"
          style={{ fontFamily: "var(--font-titillium)" }}
        >
          {label}
        </p>
        <p
          className="text-sm font-extrabold text-white"
          style={{ fontFamily: "var(--font-titillium)" }}
        >
          {code}
        </p>
      </div>
    </div>
  );
}

// Renders a predictions table cell.
// When results are available: correct picks are emerald + ✓, wrong picks are dimmed.
// team_colour in DB has no '#' prefix — prepend it for CSS.
function resultCell(
  driverId: string | null,
  actualId: string | null,
  map: Map<string, DriverInfo>,
  show: boolean,
): React.ReactNode {
  const info = driverId ? map.get(driverId) : null;
  const code = info?.code ?? "—";
  const teamColour = info?.teamColour ?? null;

  const dot = (
    <span
      style={{ background: teamColour ? `#${teamColour}` : "transparent" }}
      className="inline-block w-[7px] h-[7px] rounded-full flex-none"
      aria-hidden="true"
    />
  );

  if (!show || !driverId) {
    return (
      <span className="inline-flex items-center gap-1">
        {driverId && dot}
        {code}
      </span>
    );
  }

  const correct = driverId === actualId;
  return (
    <span
      className={`inline-flex items-center gap-1 ${
        correct ? "text-emerald-400 font-bold" : "text-white/40"
      }`}
    >
      {dot}
      {code} {correct ? "✓" : ""}
    </span>
  );
}

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
    {
      data: { user },
    },
    sessions,
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
    supabase
      .from("drivers")
      .select("id, code, team_colour, headshot_url")
      .returns<Pick<Driver, "id" | "code" | "team_colour" | "headshot_url">[]>(),
    supabase
      .from("profiles")
      .select("id, display_name")
      .returns<Pick<Profile, "id" | "display_name">[]>(),
    supabase
      .from("session_results")
      .select("driver_id, position, session_type")
      .eq("event_id", Number(eventId)),
    supabase
      .from("scores")
      .select("user_id, total_points")
      .eq("event_id", Number(eventId)),
    supabase.auth.getUser(),
    supabase
      .from("event_sessions")
      .select("session_type, date, time")
      .eq("event_id", Number(eventId))
      .returns<Pick<EventSession, "session_type" | "date" | "time">[]>()
      .then((r) => r.data ?? []),
  ]);

  if (!event) {
    return (
      <div className="flex items-center justify-center text-white h-64">
        Event not found.
      </div>
    );
  }

  // FP1 session drives the lock-time calculation
  const fp1Session = sessions.find((s) => s.session_type === "fp1") ?? null;
  const fp1DateTime = fp1Session
    ? new Date(`${fp1Session.date}T${fp1Session.time}`)
    : new Date(`${event.date}T00:00:00Z`);
  const isLocked = event.predictions_locked || fp1DateTime <= new Date();

  const driversMap = new Map<string, DriverInfo>();
  for (const d of drivers ?? []) {
    driversMap.set(d.id, {
      code: d.code,
      teamColour: d.team_colour,
      headshotUrl: d.headshot_url,
    });
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
  // Sprint qualifying results are not yet stored in session_results — see spec known limitation
  const actualSprintPole = null;
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
      <Link
        href={`/profile/${pred.user_id}`}
        className={`hover:underline ${isCurrentUser ? "font-bold text-[var(--f1-red)]" : ""}`}
      >
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
        pts != null ? (
          <span className="text-sm">{pts}</span>
        ) : (
          <span className="text-sm">—</span>
        ),
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

  return (
    <div className="p-6 text-white animate-fade-in">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <Button variant="ghost" size="sm" href={backHref}>
          &larr; Back
        </Button>

        {/* Event hero */}
        <Card className="w-full racing-stripe-bg relative overflow-hidden">
          {circuitUrl && <FallbackImage src={circuitUrl} alt="" className="circuit-bg" />}
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

        {/* Weekend schedule */}
        <SessionSchedule sessions={sessions} />

        {/* Actual results with driver cards */}
        {hasResults && (
          <Card title="Actual Results">
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {(
                [
                  { label: "Pole", driverId: actualPole },
                  { label: "P1", driverId: actualP1 },
                  { label: "P2", driverId: actualP2 },
                  { label: "P3", driverId: actualP3 },
                  { label: "P10", driverId: actualP10 },
                ] as { label: string; driverId: string | null }[]
              ).map(({ label, driverId }) => (
                <DriverResultCard
                  key={label}
                  label={label}
                  driverId={driverId}
                  driversMap={driversMap}
                />
              ))}
            </div>
            {event.is_sprint && (
              <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-[var(--glass-border)]">
                {(
                  [
                    { label: "Sprint Pole", driverId: actualSprintPole },
                    { label: "Sprint P1", driverId: actualSprintP1 },
                  ] as { label: string; driverId: string | null }[]
                ).map(({ label, driverId }) => (
                  <DriverResultCard
                    key={label}
                    label={label}
                    driverId={driverId}
                    driversMap={driversMap}
                  />
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Predictions table */}
        {isEmpty ? (
          <Card>
            <p className="text-center text-[var(--muted)] py-8">No predictions yet</p>
          </Card>
        ) : (
          <Card title="Predictions">
            <DataTable headers={headers} rows={rows} />
          </Card>
        )}

        {!isLocked && user && (
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
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```

Expected: no TypeScript or compilation errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/events/\[eventId\]/page.tsx
git commit -m "feat: add enhanced event detail page at /events/[eventId]"
```

---

## Task 3: Delete old predictions route, update all links, add loading skeleton

**Files:**
- Delete: `src/app/events/[eventId]/predictions/page.tsx`
- Delete: `src/app/events/[eventId]/predictions/loading.tsx`
- Create: `src/app/events/[eventId]/loading.tsx`
- Modify: `src/app/page.tsx` (4 links)
- Modify: `src/app/events/page.tsx` (1 link)
- Modify: `src/app/events/[eventId]/predict/page.tsx` (1 redirect)
- Modify: `src/app/events/[eventId]/predict/PredictionForm.tsx` (1 router.push)

Note: `src/app/events/[eventId]/predict/` is a sibling sub-route under `[eventId]/` and is unaffected by deleting the `predictions/` directory.

- [ ] **Step 1: Delete the old predictions route files**

```bash
rm src/app/events/\[eventId\]/predictions/page.tsx
rm src/app/events/\[eventId\]/predictions/loading.tsx
rmdir src/app/events/\[eventId\]/predictions
```

- [ ] **Step 2: Create `src/app/events/[eventId]/loading.tsx`**

Updated skeleton that mirrors the new page structure (hero + schedule + predictions table):

```tsx
// Event detail page skeleton — shown instantly on navigation
export default function EventLoading() {
  return (
    <main className="p-6 space-y-4">
      <div className="skeleton h-7 w-16 rounded-[var(--radius-md)] mb-2" />

      {/* Hero card */}
      <div className="bg-[var(--card)] border border-[var(--glass-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] p-6 space-y-3">
        <div className="skeleton h-6 w-40 rounded-[var(--radius-md)]" />
        <div className="skeleton h-8 w-2/3 rounded-[var(--radius-md)]" />
        <div className="skeleton h-4 w-1/3 rounded-[var(--radius-md)]" />
      </div>

      {/* Weekend schedule card */}
      <div className="bg-[var(--card)] border border-[var(--glass-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)]">
        <div className="px-4 py-3 border-b border-[var(--glass-border)]">
          <div className="skeleton h-4 w-36 rounded-[var(--radius-md)]" />
        </div>
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="skeleton h-8 w-[52px] rounded-[var(--radius-md)]" />
              <div className="skeleton h-5 w-12 rounded-full" />
              <div className="skeleton h-4 flex-1 rounded-[var(--radius-md)]" />
              <div className="skeleton h-4 w-12 rounded-[var(--radius-md)]" />
            </div>
          ))}
        </div>
      </div>

      {/* Predictions table card */}
      <div className="bg-[var(--card)] border border-[var(--glass-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)]">
        <div className="px-4 py-3 border-b border-[var(--glass-border)]">
          <div className="skeleton h-2 w-10 rounded-full mb-2" />
          <div className="skeleton h-4 w-36 rounded-[var(--radius-md)]" />
        </div>
        <div className="p-4">
          <div className="grid grid-cols-6 gap-2 mb-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="skeleton h-3 rounded-[var(--radius-md)]"
                style={{ width: `${40 + (i % 3) * 20}%` }}
              />
            ))}
          </div>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="grid grid-cols-6 gap-2 py-3 border-t border-[var(--border)]">
              {[...Array(6)].map((_, j) => (
                <div
                  key={j}
                  className="skeleton h-4 rounded-[var(--radius-md)]"
                  style={{ width: `${50 + ((i + j) % 3) * 15}%` }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Update `src/app/page.tsx` — 4 link changes**

Find and replace all four occurrences of `/predictions?from=/` with `?from=/`:

Line ~108 — inside `<Link href={...}>`:
```tsx
// Before
href={nextEventLocked ? `/events/${nextEvent.id}/predictions?from=/` : `/events/${nextEvent.id}/predict`}
// After
href={nextEventLocked ? `/events/${nextEvent.id}?from=/` : `/events/${nextEvent.id}/predict`}
```

Line ~131 — View Predictions button (locked state):
```tsx
// Before
<Button href={`/events/${nextEvent.id}/predictions?from=/`} variant="secondary" size="lg">
// After
<Button href={`/events/${nextEvent.id}?from=/`} variant="secondary" size="lg">
```

Line ~136 — View Predictions button (unauthenticated state):
```tsx
// Before
<Button href={`/events/${nextEvent.id}/predictions?from=/`} variant="secondary" size="lg">
// After
<Button href={`/events/${nextEvent.id}?from=/`} variant="secondary" size="lg">
```

Line ~145 — View Predictions button (has-prediction state):
```tsx
// Before
<Button href={`/events/${nextEvent.id}/predictions?from=/`} variant="secondary" size="lg">
// After
<Button href={`/events/${nextEvent.id}?from=/`} variant="secondary" size="lg">
```

- [ ] **Step 4: Update `src/app/events/page.tsx` — 1 link change**

Line ~64:
```tsx
// Before
const predictionsHref = `/events/${ev.id}/predictions?from=/events`;
// After
const predictionsHref = `/events/${ev.id}?from=/events`;
```

- [ ] **Step 5: Update `src/app/events/[eventId]/predict/page.tsx` — 1 redirect**

Line ~47:
```tsx
// Before
redirect(`/events/${eventId}/predictions?from=/`);
// After
redirect(`/events/${eventId}?from=/`);
```

- [ ] **Step 6: Update `src/app/events/[eventId]/predict/PredictionForm.tsx` — 1 router.push**

Line ~135:
```tsx
// Before
router.push(`/events/${event.id}/predictions?from=/events`);
// After
router.push(`/events/${event.id}?from=/events`);
```

- [ ] **Step 7: Verify build passes**

```bash
npm run build
```

Expected: clean build with no TypeScript errors and no broken imports. The `/events/[eventId]/predictions` route no longer exists; all links now point to `/events/[eventId]`.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: move event detail route to /events/[eventId], add loading skeleton"
```

---

## Verification

After all tasks complete:

1. `npm run build` — must pass with zero errors
2. `npm run lint` — must pass with zero warnings on changed files
3. Manual smoke test (run `npm run dev`):
   - Navigate to `/events` → click an event → lands on `/events/[id]` (not `/predictions`)
   - Weekend schedule card appears with sessions in your local timezone
   - If results exist: driver cards shown with team color bars and avatars
   - Predictions table shows colored dots before driver codes
   - Back button returns to `/events`
   - Dashboard "View Predictions" links navigate to `/events/[id]`
