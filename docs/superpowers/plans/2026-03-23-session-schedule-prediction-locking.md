# Session Schedule & Prediction Locking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Store F1 session schedules in a new `event_sessions` table, lock predictions at FP1 start, and update the dashboard countdown to show the next key session with an amber lock timer.

**Architecture:** New `event_sessions` table holds all session datetimes per event. Two new migrations add the table and update the RLS lock check. The refresh script populates sessions from the Jolpica calendar. Three pages (dashboard, predictions, predict form) and two components (RaceCountdown, new LockCountdown) are updated to use session data.

**Tech Stack:** Next.js 16 App Router, React 19, Supabase JS client v2, Tailwind CSS 4, TypeScript, `npx tsx` for scripts.

---

## File Map

| File | Change |
|------|--------|
| `supabase/migrations/007_event_sessions.sql` | **Create** — new table, RLS, REVOKE |
| `supabase/migrations/008_update_predictions_rls.sql` | **Create** — replace date lock check with FP1 datetime |
| `src/types/database.ts` | **Modify** — add `EventSession` interface |
| `scripts/refresh-season.ts` | **Modify** — refactor to hoist calendar fetch; add `upsertEventSessions` |
| `src/components/RaceCountdown.tsx` | **Modify** — add optional `sessionLabel` prop |
| `src/components/LockCountdown.tsx` | **Create** — amber lock timer client component |
| `src/app/page.tsx` | **Modify** — event_sessions query, lock state, hero card changes |
| `src/app/loading.tsx` | **Modify** — lock row skeleton below countdown |
| `src/app/events/[eventId]/predict/page.tsx` | **Modify** — FP1 query in Promise.all, update lock check |
| `src/app/events/[eventId]/predictions/page.tsx` | **Modify** — FP1 query, derive `isLocked`, gate edit button |

---

## Task 1: Database migration — `event_sessions` table

**Files:**
- Create: `supabase/migrations/007_event_sessions.sql`

- [ ] **Step 1: Write migration 007**

```sql
-- supabase/migrations/007_event_sessions.sql
-- Session schedule for each event (FP1, FP2, FP3, qualifying, sprint, race)

CREATE TABLE event_sessions (
  id           SERIAL PRIMARY KEY,
  event_id     INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL CHECK (session_type IN (
                  'fp1', 'fp2', 'fp3',
                  'sprint_qualifying', 'sprint_race',
                  'qualifying', 'race'
                )),
  date         DATE NOT NULL,
  time         TEXT NOT NULL,   -- HH:MM:SSZ UTC
  UNIQUE(event_id, session_type)
);

ALTER TABLE event_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read event sessions"
  ON event_sessions FOR SELECT USING (true);

-- Mirror migration 004: revoke write grants from authenticated
-- (service role only writes via refresh script)
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON event_sessions FROM authenticated;
```

- [ ] **Step 2: Apply migration via Supabase MCP**

Use `apply_migration` tool with project ID `punadrnngqlsjjiknjgx`, name `event_sessions`, and the SQL above.

- [ ] **Step 3: Verify table exists**

Run SQL: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'event_sessions' ORDER BY ordinal_position;`

Expected: rows for id, event_id, session_type, date, time.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/007_event_sessions.sql
git commit -m "feat: add event_sessions table for session schedule storage"
```

---

## Task 2: Database migration — update predictions RLS

**Files:**
- Create: `supabase/migrations/008_update_predictions_rls.sql`

- [ ] **Step 1: Write migration 008**

```sql
-- supabase/migrations/008_update_predictions_rls.sql
-- Replace date-based lock check with FP1 session datetime.
-- Falls back to events.date::TIMESTAMPTZ (midnight UTC on race day)
-- if no FP1 session exists, preserving the previous lock boundary.

DROP POLICY IF EXISTS "Users insert own predictions when unlocked" ON predictions;
DROP POLICY IF EXISTS "Users update own predictions when unlocked" ON predictions;

CREATE POLICY "Users insert own predictions when unlocked" ON predictions
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND NOT (SELECT e.predictions_locked FROM events e WHERE e.id = predictions.event_id)
    AND COALESCE(
      (
        SELECT (es.date || 'T' || es.time)::TIMESTAMPTZ
        FROM event_sessions es
        WHERE es.event_id = predictions.event_id
          AND es.session_type = 'fp1'
      ),
      (SELECT e.date FROM events e WHERE e.id = predictions.event_id)::TIMESTAMPTZ
    ) > NOW()
  );

CREATE POLICY "Users update own predictions when unlocked" ON predictions
  FOR UPDATE
  USING (
    auth.uid() = user_id
    AND NOT (SELECT e.predictions_locked FROM events e WHERE e.id = predictions.event_id)
    AND COALESCE(
      (
        SELECT (es.date || 'T' || es.time)::TIMESTAMPTZ
        FROM event_sessions es
        WHERE es.event_id = predictions.event_id
          AND es.session_type = 'fp1'
      ),
      (SELECT e.date FROM events e WHERE e.id = predictions.event_id)::TIMESTAMPTZ
    ) > NOW()
  );
```

- [ ] **Step 2: Apply migration via Supabase MCP**

Use `apply_migration` with name `update_predictions_rls` and the SQL above.

- [ ] **Step 3: Verify policies exist**

Run SQL: `SELECT policyname, cmd FROM pg_policies WHERE tablename = 'predictions' ORDER BY policyname;`

Expected: see `Users insert own predictions when unlocked` and `Users update own predictions when unlocked` in the results (old policies with same names replaced).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/008_update_predictions_rls.sql
git commit -m "feat: lock predictions at FP1 session start instead of race date"
```

---

## Task 3: Add `EventSession` type

**Files:**
- Modify: `src/types/database.ts`

- [ ] **Step 1: Add the interface** — append after the `Score` interface (around line 107):

```ts
// ── Event Sessions ───────────────────────────────────────────
export interface EventSession {
  id: number;
  event_id: number;
  session_type: 'fp1' | 'fp2' | 'fp3' | 'sprint_qualifying' | 'sprint_race' | 'qualifying' | 'race';
  date: string;  // YYYY-MM-DD
  time: string;  // HH:MM:SSZ
}
```

- [ ] **Step 2: Build to verify no TS errors**

```bash
npm run build
```
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/types/database.ts
git commit -m "feat: add EventSession type"
```

---

## Task 4: Update refresh script to upsert event sessions

**Files:**
- Modify: `scripts/refresh-season.ts`

- [ ] **Step 1: Hoist the calendar fetch in `main()`**

The `getSeasonCalendar` call currently lives inside `upsertEvents`. Move it to `main()` so the same calendar data can be reused for sessions without a second API call. Modify `upsertEvents` to accept the calendar as a parameter:

Replace the existing `upsertEvents` signature and internal fetch:

```ts
// Change signature from:
async function upsertEvents(seasonYear: number) {

// To:
async function upsertEvents(seasonYear: number, calendar: Awaited<ReturnType<typeof getSeasonCalendar>>) {
```

Replace the first two lines of `upsertEvents` body:
```ts
// Remove:
const calendar = await getSeasonCalendar(seasonYear);

// The variable is now the parameter, no change needed to the rest of the function body.
// Just delete the `getSeasonCalendar` call line — `calendar` is already in scope.
```

Update `main()` to fetch the calendar and pass it:
```ts
async function main() {
  console.log(`\nRefreshing season data for ${seasonYear}\n${"=".repeat(40)}`);

  await upsertSeason(seasonYear);

  const calendar = await getSeasonCalendar(seasonYear);
  const eventCount = await upsertEvents(seasonYear, calendar);
  await upsertEventSessions(seasonYear, calendar);
  const driverCount = await upsertDrivers(seasonYear);

  console.log(`\nDone! Season ${seasonYear}: ${eventCount} events, ${driverCount} drivers`);
}
```

- [ ] **Step 2: Add the `upsertEventSessions` function** — insert before `main()`:

```ts
async function upsertEventSessions(
  seasonYear: number,
  calendar: Awaited<ReturnType<typeof getSeasonCalendar>>,
) {
  if (calendar.length === 0) return;

  // Get DB event IDs keyed by round number
  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id, round")
    .eq("season_year", seasonYear);
  if (eventsError) throw eventsError;

  const eventIdByRound = new Map<number, number>();
  for (const e of events ?? []) {
    eventIdByRound.set(e.round, e.id);
  }

  type SessionRow = { event_id: number; session_type: string; date: string; time: string };
  const sessions: SessionRow[] = [];

  for (const race of calendar) {
    const round = parseInt(race.round, 10);
    const eventId = eventIdByRound.get(round);
    if (!eventId) continue;

    // Race itself (from base fields)
    if (race.date && race.time) {
      sessions.push({ event_id: eventId, session_type: "race", date: race.date, time: race.time });
    }

    // Map optional session fields — skip if missing
    const mappings: Array<[{ date: string; time: string } | undefined, string]> = [
      [race.FirstPractice,                              "fp1"],
      [race.SecondPractice,                             "fp2"],
      [race.ThirdPractice,                              "fp3"],
      [race.Qualifying,                                 "qualifying"],
      [race.Sprint,                                     "sprint_race"],
      [race.SprintQualifying ?? race.SprintShootout,    "sprint_qualifying"],
    ];

    for (const [sessionTime, sessionType] of mappings) {
      if (sessionTime?.date && sessionTime.time) {
        sessions.push({ event_id: eventId, session_type: sessionType, date: sessionTime.date, time: sessionTime.time });
      }
    }
  }

  if (sessions.length === 0) {
    console.log("No session times available in calendar data — skipping session upsert");
    return;
  }

  const { error } = await supabase
    .from("event_sessions")
    .upsert(sessions, { onConflict: "event_id,session_type" });

  if (error) throw error;
  console.log(`Upserted ${sessions.length} event sessions`);
}
```

- [ ] **Step 3: Verify the script compiles**

```bash
npx tsc --noEmit scripts/refresh-season.ts 2>&1 || npm run build
```
Expected: no new TS errors.

- [ ] **Step 4: Commit**

```bash
git add scripts/refresh-season.ts
git commit -m "feat: upsert event sessions from Jolpica calendar in refresh script"
```

---

## Task 5: Update `RaceCountdown` — add `sessionLabel` prop

**Files:**
- Modify: `src/components/RaceCountdown.tsx`

- [ ] **Step 1: Add `sessionLabel` to the props type and render it above the countdown**

Replace the current `RaceCountdownProps` type and component signature:

```ts
// Change:
type RaceCountdownProps = {
  targetDate: string;
  targetTime: string | null;
};

export default function RaceCountdown({ targetDate, targetTime }: RaceCountdownProps) {

// To:
type RaceCountdownProps = {
  targetDate: string;
  targetTime: string | null;
  sessionLabel?: string;
};

export default function RaceCountdown({ targetDate, targetTime, sessionLabel }: RaceCountdownProps) {
```

In the JSX return, add the label above the countdown div. The current non-lights-out return is:

```tsx
return (
  <div className={`countdown ${days === 0 ? "animate-pulse-glow" : ""}`} aria-label="countdown">
    ...
  </div>
);
```

Wrap it to include the label:

```tsx
return (
  <div>
    {sessionLabel && (
      <p
        className="text-xs text-[var(--muted)] uppercase tracking-wider mb-1"
        style={{ fontFamily: "var(--font-titillium)" }}
      >
        {sessionLabel}
      </p>
    )}
    <div className={`countdown ${days === 0 ? "animate-pulse-glow" : ""}`} aria-label="countdown">
      <Segment value={days} label="Days" />
      <span className="countdown-separator">:</span>
      <Segment value={String(hours).padStart(2, "0")} label="Hours" />
      <span className="countdown-separator">:</span>
      <Segment value={String(minutes).padStart(2, "0")} label="Minutes" />
      <span className="countdown-separator">:</span>
      <Segment value={String(seconds).padStart(2, "0")} label="Seconds" />
    </div>
  </div>
);
```

- [ ] **Step 2: Build**

```bash
npm run build
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/RaceCountdown.tsx
git commit -m "feat: add optional sessionLabel prop to RaceCountdown"
```

---

## Task 6: Create `LockCountdown` component

**Files:**
- Create: `src/components/LockCountdown.tsx`

- [ ] **Step 1: Create the file**

```tsx
"use client";

import { useEffect, useState } from "react";

type LockCountdownProps = {
  lockDate: string | null;
  lockTime: string | null;
};

export default function LockCountdown({ lockDate, lockTime }: LockCountdownProps) {
  // null = not yet mounted (avoids hydration flash)
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!lockDate || !lockTime) return;

    let dateTime: Date;
    try {
      const hasZone = lockTime.includes("Z") || lockTime.includes("+");
      const timeString = hasZone ? lockTime : `${lockTime}Z`;
      dateTime = new Date(`${lockDate}T${timeString}`);
      if (isNaN(dateTime.getTime())) return;
    } catch {
      return;
    }

    const tick = () => {
      const diffSec = Math.floor((dateTime.getTime() - Date.now()) / 1000);
      setTimeLeft(Math.max(0, diffSec));
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lockDate, lockTime]);

  // Not mounted, no data, or already locked — show nothing
  if (timeLeft === null || timeLeft <= 0) return null;

  const days = Math.floor(timeLeft / 86400);
  const hours = Math.floor((timeLeft % 86400) / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const timeStr = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div className="flex items-center gap-2 pt-2 mt-1 border-t border-[var(--glass-border)]">
      <svg
        width="11"
        height="11"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="text-amber-500 flex-shrink-0"
        aria-hidden="true"
      >
        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
      </svg>
      <span
        className="text-xs text-[var(--muted)] uppercase tracking-wider"
        style={{ fontFamily: "var(--font-titillium)" }}
      >
        Predictions lock in
      </span>
      <span
        className="text-sm font-bold text-amber-500"
        style={{ fontFamily: "var(--font-titillium)" }}
      >
        {days > 0 ? `${days}d ` : ""}{timeStr}
      </span>
    </div>
  );
}
```

- [ ] **Step 2: Build**

```bash
npm run build
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/LockCountdown.tsx
git commit -m "feat: add LockCountdown amber timer component"
```

---

## Task 7: Update dashboard page

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/loading.tsx`

- [ ] **Step 1: Add imports** at the top of `src/app/page.tsx`:

```ts
import LockCountdown from "@/components/LockCountdown";
import type { EventSession } from "@/types/database";
```

- [ ] **Step 2: Add session label helper** — add this function just before the `DashboardPage` component:

```ts
function formatSessionLabel(sessionType: EventSession["session_type"]): string {
  const labels: Record<EventSession["session_type"], string> = {
    fp1: "FP1",
    fp2: "FP2",
    fp3: "FP3",
    sprint_qualifying: "Sprint Qualifying",
    sprint_race: "Sprint Race",
    qualifying: "Qualifying",
    race: "Race",
  };
  return `Next: ${labels[sessionType]}`;
}
```

- [ ] **Step 3: Restructure data fetching** — replace the current `Promise.all` + `hasPrediction` block (lines 17–47) with:

```ts
const [
  { data: nextEvent },
  { data: pastEvents },
  { data: leaders },
  { data: { user } },
  news,
] = await Promise.all([
  supabase.from("events").select("*").gte("date", today).order("date", { ascending: true }).limit(1).maybeSingle(),
  supabase.from("events").select("round").lt("date", today).order("round", { ascending: false }).limit(1).maybeSingle(),
  supabase.from("leaderboard").select("user_id, display_name, total_points").order("total_points", { ascending: false }).limit(5),
  supabase.auth.getUser(),
  fetchNews(5),
]);

const completedRounds = pastEvents?.round ?? 0;

// Follow-up queries that depend on nextEvent (run in parallel)
const [eventSessions, hasPrediction] = await Promise.all([
  nextEvent
    ? supabase
        .from("event_sessions")
        .select("session_type, date, time")
        .eq("event_id", nextEvent.id)
        .in("session_type", ["fp1", "sprint_qualifying", "sprint_race", "qualifying", "race"])
        .order("date", { ascending: true })
        .order("time", { ascending: true })
        .returns<Pick<EventSession, "session_type" | "date" | "time">[]>()
        .then((r) => r.data)
    : Promise.resolve(null),
  nextEvent && user
    ? supabase
        .from("predictions")
        .select("id", { count: "exact", head: true })
        .eq("event_id", nextEvent.id)
        .eq("user_id", user.id)
        .then((r) => !!r.count)
    : Promise.resolve(false),
]);

const now = new Date();
const fp1Session = eventSessions?.find((s) => s.session_type === "fp1") ?? null;
const nextKeySession =
  eventSessions?.find((s) => s.session_type !== "fp1" && new Date(`${s.date}T${s.time}`) > now) ?? null;

const fp1DateTime = fp1Session
  ? new Date(`${fp1Session.date}T${fp1Session.time}`)
  : new Date(`${nextEvent?.date ?? ""}T00:00:00Z`);
const nextEventLocked = nextEvent
  ? nextEvent.predictions_locked || fp1DateTime <= now
  : false;
```

- [ ] **Step 4: Update hero card JSX** — make these targeted changes inside the hero card `<div className="p-6 space-y-3 relative">`:

**4a — Badge row:** replace the existing badge `<div>` (lines 59–67) with:
```tsx
<div className="flex items-center justify-between">
  <div className="flex items-center gap-2">
    {nextEvent?.is_sprint && (
      <Badge label="Sprint Weekend" tone="sprint" />
    )}
    {nextEvent && !nextEventLocked && (
      <Badge label="Predictions Open" tone="open" />
    )}
    {nextEventLocked && nextEvent && (
      <Badge label="Predictions Locked" tone="locked" />
    )}
  </div>
</div>
```

**4b — RaceCountdown call:** replace line 85:
```tsx
// Before:
<RaceCountdown targetDate={nextEvent.date} targetTime={nextEvent.time} />

// After:
<RaceCountdown
  targetDate={nextKeySession?.date ?? nextEvent.date}
  targetTime={nextKeySession?.time ?? nextEvent.time ?? null}
  sessionLabel={nextKeySession ? formatSessionLabel(nextKeySession.session_type) : "Next: Race"}
/>
<LockCountdown
  lockDate={!nextEventLocked ? (fp1Session?.date ?? null) : null}
  lockTime={!nextEventLocked ? (fp1Session?.time ?? null) : null}
/>
```

- [ ] **Step 5: Update `loading.tsx`** — add a lock row skeleton below the countdown placeholder (after the four `h-14` skeleton divs, before the button skeleton):

```tsx
{/* Lock row skeleton */}
<div className="flex items-center gap-2 pt-2 mt-1 border-t border-[var(--glass-border)]">
  <div className="skeleton h-3 w-3 rounded-full" />
  <div className="skeleton h-3 w-32 rounded-[var(--radius-md)]" />
  <div className="skeleton h-3 w-20 rounded-[var(--radius-md)]" />
</div>
```

- [ ] **Step 6: Build**

```bash
npm run build
```
Expected: no errors. If Badge `tone="open"` is not yet defined, check `src/components/Badge.tsx` and add it — or use `tone="points"` as a temporary stand-in and note it for a follow-up.

- [ ] **Step 7: Commit**

```bash
git add src/app/page.tsx src/app/loading.tsx
git commit -m "feat: update dashboard with next-session countdown and lock timer"
```

---

## Task 8: Update predict form page

**Files:**
- Modify: `src/app/events/[eventId]/predict/page.tsx`

- [ ] **Step 1: Add `EventSession` to imports**

```ts
// Change:
import type { Driver, Event, Prediction } from "@/types/database";
// To:
import type { Driver, Event, EventSession, Prediction } from "@/types/database";
```

- [ ] **Step 2: Add FP1 session query inside the existing `Promise.all`**

Replace:
```ts
const [{ data: event }, { data: drivers }] = await Promise.all([
  supabase
    .from("events")
    .select("*")
    .eq("id", Number(eventId))
    .single<Event>(),
  supabase.from("drivers").select("*").returns<Driver[]>(),
]);
```

With:
```ts
const [{ data: event }, { data: drivers }, { data: fp1Session }] = await Promise.all([
  supabase
    .from("events")
    .select("*")
    .eq("id", Number(eventId))
    .single<Event>(),
  supabase.from("drivers").select("*").returns<Driver[]>(),
  supabase
    .from("event_sessions")
    .select("date, time")
    .eq("event_id", Number(eventId))
    .eq("session_type", "fp1")
    .maybeSingle<Pick<EventSession, "date" | "time">>(),
]);
```

- [ ] **Step 3: Replace `hasEventBegun` with FP1-based lock check**

Remove the `hasEventBegun` helper function entirely (lines 7–12).

Replace line 65:
```ts
// Before:
const isLocked = event.predictions_locked || hasEventBegun(event);

// After:
const fp1DateTime = fp1Session
  ? new Date(`${fp1Session.date}T${fp1Session.time}`)
  : new Date(`${event.date}T00:00:00Z`);
const isLocked = event.predictions_locked || fp1DateTime <= new Date();
```

- [ ] **Step 4: Build**

```bash
npm run build
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/events/[eventId]/predict/page.tsx
git commit -m "feat: lock predict form at FP1 session start"
```

---

## Task 9: Update predictions page

**Files:**
- Modify: `src/app/events/[eventId]/predictions/page.tsx`

- [ ] **Step 1: Add `EventSession` to imports**

```ts
// Change:
import type { Driver, Event, Prediction, Profile } from "@/types/database";
// To:
import type { Driver, Event, EventSession, Prediction, Profile } from "@/types/database";
```

- [ ] **Step 2: Add FP1 session query to the existing `Promise.all`**

The existing Promise.all has 7 entries. Add an 8th:

```ts
// Add to the Promise.all destructure:
{ data: fp1Session },

// Add to the Promise.all array:
supabase
  .from("event_sessions")
  .select("date, time")
  .eq("event_id", Number(eventId))
  .eq("session_type", "fp1")
  .maybeSingle<Pick<EventSession, "date" | "time">>(),
```

- [ ] **Step 3: Derive `isLocked`** — add after the `if (!event)` check:

```ts
const fp1DateTime = fp1Session
  ? new Date(`${fp1Session.date}T${fp1Session.time}`)
  : new Date(`${event.date}T00:00:00Z`);
const isLocked = event.predictions_locked || fp1DateTime <= new Date();
```

- [ ] **Step 4: Update the "Make / Edit predictions" button condition**

Replace (line ~266):
```tsx
// Before:
{!hasResults && user && (

// After:
{!isLocked && user && (
```

- [ ] **Step 5: Build**

```bash
npm run build
```
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/events/[eventId]/predictions/page.tsx
git commit -m "feat: gate edit predictions button on FP1 lock time"
```

---

## Task 10: Final verification and push

- [ ] **Step 1: Full clean build**

```bash
npm run build
```
Expected: `✓ Compiled successfully` with no errors or type warnings.

- [ ] **Step 2: Lint**

```bash
npm run lint
```
Expected: no errors.

- [ ] **Step 3: Push**

```bash
git push
```

---

## Notes

- **Badge `tone="open"`**: If `Badge` doesn't have an `open` tone, check `src/components/Badge.tsx`. The spec calls for a green "Predictions Open" badge — add `open` tone with `bg-emerald-500/10 text-emerald-400 border-emerald-500/20` styling, matching the existing tone pattern.
- **Backfill existing sessions**: After deploying, run `SEASON=2026 npx tsx scripts/refresh-season.ts` to populate `event_sessions` for all 2026 events. The lock countdown will remain hidden until this is done.
- **`events.time` redundancy**: `event_sessions WHERE session_type = 'race'` now duplicates `events.time`. Marked for clean-up in a follow-on migration — do not remove in this work.
