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

RLS: public SELECT, no INSERT/UPDATE/DELETE for authenticated users (service role only, via refresh script).

### Updated RLS lock check (migration 008)

Replaces the `events.date > CURRENT_DATE` check in the INSERT and UPDATE policies on `predictions` with:

```sql
COALESCE(
  (
    SELECT (es.date || 'T' || es.time)::TIMESTAMPTZ
    FROM event_sessions es
    WHERE es.event_id = event_id
      AND es.session_type = 'fp1'
  ),
  (SELECT e.date FROM events e WHERE e.id = event_id)::TIMESTAMPTZ + INTERVAL '1 day'
) > NOW()
```

The `COALESCE` fallback ensures events with no session data yet still lock at midnight on race day — preserving backward compatibility.

### Known redundancy

`events.time` (race start time) is now duplicated by `event_sessions WHERE session_type = 'race'`. It is **not** removed in this work to avoid churn across all current readers. Marked for clean-up as a follow-on migration.

---

## 2. Refresh Script (`scripts/refresh-season.ts`)

After upserting each event, upsert its sessions from the Jolpica `JolpicaRaceSchedule` fields:

| Jolpica field         | `session_type`      |
|-----------------------|---------------------|
| `FirstPractice`       | `fp1`               |
| `SecondPractice`      | `fp2`               |
| `ThirdPractice`       | `fp3`               |
| `Qualifying`          | `qualifying`        |
| `Sprint`              | `sprint_race`       |
| `SprintQualifying` / `SprintShootout` | `sprint_qualifying` |
| Race date/time (from base fields) | `race`  |

Each session upsert uses `ON CONFLICT (event_id, session_type) DO UPDATE` to keep times current on re-runs.

---

## 3. Dashboard (`src/app/page.tsx`)

### Two additional parallel queries (added to existing `Promise.all`)

1. **Next key session** — first upcoming session for the next event from the set `{sprint_qualifying, sprint_race, qualifying, race}`:
   ```sql
   SELECT session_type, date, time FROM event_sessions
   WHERE event_id = $1
     AND session_type IN ('sprint_qualifying', 'sprint_race', 'qualifying', 'race')
     AND (date || 'T' || time)::TIMESTAMPTZ > NOW()
   ORDER BY (date || 'T' || time)::TIMESTAMPTZ ASC
   LIMIT 1
   ```

2. **FP1 session** — for the lock countdown:
   ```sql
   SELECT date, time FROM event_sessions
   WHERE event_id = $1 AND session_type = 'fp1'
   ```

### Lock state derivation

Replace the current `nextEventStarted` check (which uses `events.date`/`events.time`) with:

```ts
const fp1DateTime = fp1Session
  ? new Date(`${fp1Session.date}T${fp1Session.time}`)
  : new Date(`${nextEvent.date}T00:00:00Z`); // fallback
const nextEventLocked = nextEvent.predictions_locked || fp1DateTime <= new Date();
```

### Hero card changes

- **Session label** above countdown: "Next: Sprint Qualifying", "Next: Race", etc. (from next key session query). Falls back to "Race" label if no session data.
- **"Predictions Open" badge**: new green badge shown when not locked (in addition to existing Sprint Weekend badge).
- **"🔒 Predictions Locked" badge**: already exists; shown when locked.
- **`RaceCountdown` target**: changed from `event.date`/`event.time` to `nextSession.date`/`nextSession.time`.
- **Lock timer row** (Option B — below main countdown): amber row showing "Predictions lock in 1d 18:12:04". Hidden when locked. Hidden when no FP1 session data available.

---

## 4. `RaceCountdown` Component

Extended props:
- `sessionLabel: string` — displayed above the countdown digits (e.g. "Next: Qualifying")
- `targetDate` / `targetTime` — now point to the next key session, not always the race

No changes to internal countdown logic.

---

## 5. New `LockCountdown` Client Component

Small client component co-located in `src/components/` (or inlined in the dashboard hero if simple enough).

- Props: `lockDate: string`, `lockTime: string`
- Renders the amber lock row: lock icon + "Predictions lock in" label + `Xd HH:MM:SS` countdown
- Returns `null` if `lockDate`/`lockTime` are null
- Returns `null` if lock time has already passed (locked state has no timer)

---

## 6. Predictions Page (`/events/[eventId]/predictions`)

Currently determines locked/open state using `event.date` to show or hide the "Make / Edit predictions" button. Updated to:
1. Query `event_sessions WHERE session_type = 'fp1'` for the event
2. Use the same FP1 datetime fallback logic to determine `isLocked`

---

## 7. Predict Form Page (`/events/[eventId]/predict`)

Server-side lock redirect currently compares `event.date` against today. Updated to query FP1 session datetime and compare against `new Date()`. Fallback to `event.date` if no FP1 session exists.

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
