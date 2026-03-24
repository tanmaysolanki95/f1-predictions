# Session Schedule & Prediction Locking

**Date:** 2026-03-23
**Status:** Approved

## Overview

Store full session schedules from the Jolpica API in a new `event_sessions` table. Use the first session of the weekend (FP1) as the prediction lock trigger instead of the race date. Update the dashboard countdown to show the next upcoming key session, with a secondary lock countdown timer. Add visual lock state indicators throughout.

---

## 1. Data Layer

### New table: `event_sessions` (migration 007)

```sql
CREATE TABLE event_sessions (
  id           SERIAL PRIMARY KEY,
  event_id     INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL CHECK (session_type IN (
                  'fp1', 'fp2', 'fp3',
                  'sprint_qualifying', 'sprint_race',
                  'qualifying', 'race'
                )),
  date         DATE NOT NULL,
  time         TEXT NOT NULL,  -- HH:MM:SSZ UTC
  UNIQUE(event_id, session_type)
);
```

RLS: public SELECT. Explicitly revoke writes from authenticated users to match migration 004's pattern:

```sql
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON event_sessions FROM authenticated;
```

Service role writes only (via refresh script).

### Updated RLS lock check (migration 008)

Replaces the `events.date > CURRENT_DATE` check in the INSERT and UPDATE policies on `predictions`. The subquery references `predictions.event_id` explicitly to avoid ambiguous column resolution in the policy context:

```sql
COALESCE(
  (
    SELECT (es.date || 'T' || es.time)::TIMESTAMPTZ
    FROM event_sessions es
    WHERE es.event_id = predictions.event_id
      AND es.session_type = 'fp1'
  ),
  (SELECT e.date FROM events e WHERE e.id = predictions.event_id)::TIMESTAMPTZ
) > NOW()
```

The `COALESCE` fallback uses `events.date::TIMESTAMPTZ` (midnight UTC on race day) — preserving the exact same lock boundary as the current policy for events with no session data.

> **Note on Postgres scoping:** The existing migration 003 uses bare `event_id` in correlated subqueries, relying on Postgres resolving it as `predictions.event_id` from the row being evaluated. Migration 008 makes this explicit with `predictions.event_id` for clarity.

### Known redundancy

`events.time` (race start time) is now duplicated by `event_sessions WHERE session_type = 'race'`. It is **not** removed in this work to avoid churn across all current readers. Marked for clean-up as a follow-on migration.

---

## 2. Refresh Script (`scripts/refresh-season.ts`)

After upserting each event, upsert its sessions from the Jolpica `JolpicaRaceSchedule` fields:

| Jolpica field                          | `session_type`      |
|----------------------------------------|---------------------|
| `FirstPractice`                        | `fp1`               |
| `SecondPractice`                       | `fp2`               |
| `ThirdPractice`                        | `fp3`               |
| `Qualifying`                           | `qualifying`        |
| `Sprint`                               | `sprint_race`       |
| `SprintQualifying` / `SprintShootout`  | `sprint_qualifying` |
| Race date/time (from base race fields) | `race`              |

Each session upsert uses `ON CONFLICT (event_id, session_type) DO UPDATE` to keep times current on re-runs. Sessions with missing Jolpica data (e.g. no `ThirdPractice` on sprint weekends) are skipped — not inserted as nulls.

---

## 3. Dashboard (`src/app/page.tsx`)

### One additional parallel query (added to existing `Promise.all`)

A single query fetches both the FP1 session (for lock timing) and the next key session (for the countdown) in one round-trip:

```sql
SELECT session_type, date, time FROM event_sessions
WHERE event_id = $1
  AND session_type IN ('fp1', 'sprint_qualifying', 'sprint_race', 'qualifying', 'race')
ORDER BY (date || 'T' || time)::TIMESTAMPTZ ASC
```

This query is only issued when `nextEvent` is non-null. The TypeScript side separates results:
- `fp1Session` — the row where `session_type === 'fp1'`
- `nextKeySession` — first row where `session_type !== 'fp1'` and datetime > now. If no such row exists (all key sessions are past, or no session data was returned), falls back to `event.date`/`event.time`

### Lock state derivation

Replace the current `nextEventStarted` check (which uses `events.date`/`events.time`) with:

```ts
const fp1DateTime = fp1Session
  ? new Date(`${fp1Session.date}T${fp1Session.time}`)
  : new Date(`${nextEvent.date}T00:00:00Z`); // fallback: midnight race day UTC
const nextEventLocked = nextEvent.predictions_locked || fp1DateTime <= new Date();
```

### Hero card changes

- **Session label** above countdown: "Next: Sprint Qualifying", "Next: Race", etc. Falls back to "Race" if no session data.
- **Badge row** (existing `flex gap-2` container): add "Predictions Open" green badge when not locked, alongside the existing Sprint Weekend badge. "🔒 Predictions Locked" badge already exists and is shown when locked.
- **`RaceCountdown` target**: changed from `event.date`/`event.time` to `nextKeySession.date`/`nextKeySession.time`. Falls back to `event.date`/`event.time` if no session data.
- **Lock timer row** (Option B — below main countdown): amber row showing "Predictions lock in 1d 18:12:04". Hidden when locked or when no FP1 session data is available.

---

## 4. `RaceCountdown` Component

Extended props:
- `sessionLabel?: string` — optional, displayed above the countdown digits (e.g. "Next: Qualifying"). Defaults to `"Race"` if omitted.
- `targetDate` / `targetTime` — now point to the next key session, not always the race.

No changes to internal countdown logic.

---

## 5. New `LockCountdown` Client Component

Small client component in `src/components/LockCountdown.tsx`.

- Props: `lockDate: string | null`, `lockTime: string | null`
- Returns `null` if `lockDate` or `lockTime` is null
- Returns `null` if the lock datetime has already passed (locked state shows no timer)
- Uses the same defensive datetime parsing as `RaceCountdown`: check `isNaN` after construction, guard against missing `Z` suffix
- Renders the amber lock row: lock icon + "Predictions lock in" label + `Xd HH:MM:SS` countdown
- Omits the days segment when `days === 0`, matching `RaceCountdown` behaviour
- On the server render pass (before hydration), renders `null` to avoid a time-zone flash — the amber row appears only after client hydration

---

## 6. Predictions Page (`/events/[eventId]/predictions`)

The current page does not have an explicit `isLocked` variable — visibility of the "Make / Edit predictions" button is currently controlled by `hasResults` and the `user` check, not a date comparison. The FP1 lock check is needed here to correctly gate the button for events that have session data but are not yet scored.

Add an `event_sessions` query for FP1 alongside the existing 7 parallel queries. Derive `isLocked`:

```ts
const isLocked = event.predictions_locked
  || (fp1Session
      ? new Date(`${fp1Session.date}T${fp1Session.time}`) <= new Date()
      : new Date(`${event.date}T00:00:00Z`) <= new Date());
```

Use `isLocked` (instead of only `hasResults`) to gate the "Make / Edit predictions" button.

---

## 7. Predict Form Page (`/events/[eventId]/predict`)

The server-side lock redirect currently compares `event.date` against today. Add the FP1 session query **inside the existing `Promise.all`** alongside the `events` and `drivers` queries (not as a separate sequential round-trip after it). Derive lock state using the same FP1 fallback pattern and redirect to the predictions view if locked.

---

## 8. TypeScript Types (`src/types/database.ts`)

New `EventSession` interface:

```ts
export interface EventSession {
  id: number;
  event_id: number;
  session_type: 'fp1' | 'fp2' | 'fp3' | 'sprint_qualifying' | 'sprint_race' | 'qualifying' | 'race';
  date: string;  // YYYY-MM-DD
  time: string;  // HH:MM:SSZ
}
```

---

## 9. Loading Skeletons

`src/app/loading.tsx` — add a lock row skeleton below the countdown skeleton in the hero card (narrow amber-tinted bar, matching the lock row height).

---

## Out of Scope

- Removing `events.time` (follow-on clean-up)
- Displaying FP1/FP2/FP3 times anywhere in the UI
- Session schedule on the Events list page (`/events`)
- Push notifications or email alerts for prediction lock
