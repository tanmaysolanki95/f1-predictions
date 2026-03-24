# Predictions Page Enhancement — Design Spec
Date: 2026-03-24

## Overview

Enhance the event predictions page (`/events/[eventId]/predictions`) to show:
1. A race weekend session schedule (FP1, FP2, FP3, Qualifying, Race) with times in the user's local timezone
2. A richer Actual Results card with driver headshot cards and team colors
3. Predictions table cells enhanced with team color dots before driver codes

## Scope

All changes are confined to:
- `src/app/events/[eventId]/predictions/page.tsx` — data fetching and layout changes
- `src/components/SessionSchedule.tsx` — new client component (session schedule)
- The Actual Results card (inline in page) — replace flat grid with driver cards
- The `resultCell` helper (inline in page) — add team color dot

---

## Section 1 — Data

### Change: fetch all event sessions
Currently the page fetches only the FP1 session (for lock-time calculation). Replace with a query for all `event_sessions` rows for the event.

```ts
// Before (single fp1 query)
supabase
  .from("event_sessions")
  .select("date, time")
  .eq("event_id", Number(eventId))
  .eq("session_type", "fp1")
  .maybeSingle()

// After (all sessions)
supabase
  .from("event_sessions")
  .select("session_type, date, time")
  .eq("event_id", Number(eventId))
  .returns<Pick<EventSession, "session_type" | "date" | "time">[]>()
```

FP1 lock-time logic is unchanged — filter `fp1` from the full array instead of relying on the single-row query.

### Change: fetch full driver rows
Currently drivers are fetched as `id, code` only. Expand to include `team_colour` and `headshot_url` for the results card and color dots.

```ts
// Before
supabase.from("drivers").select("id, code")

// After
supabase.from("drivers").select("id, code, team_colour, headshot_url")
```

Both queries remain inside the existing `Promise.all` — no sequential fetching introduced.

---

## Section 2 — `SessionSchedule` client component

**File:** `src/components/SessionSchedule.tsx`

### Props
```ts
interface Props {
  sessions: Pick<EventSession, "session_type" | "date" | "time">[];
}
```

### Behavior
- `"use client"` — uses `Intl.DateTimeFormat().resolvedOptions().timeZone` to detect browser timezone
- Sorts sessions by `date + time` ascending
- Groups rows by day — the day label (short weekday + date number) is shown only on the first session of each day
- Wrapped in the existing `Card` component with title `"Weekend Schedule"`

### Session label map
| `session_type`      | Badge  | Full name           | Row tint        |
|---------------------|--------|---------------------|-----------------|
| `fp1`               | FP1    | Practice 1          | none            |
| `fp2`               | FP2    | Practice 2          | none            |
| `fp3`               | FP3    | Practice 3          | none            |
| `sprint_qualifying` | SQ     | Sprint Qualifying   | none            |
| `sprint_race`       | SR     | Sprint Race         | none            |
| `qualifying`        | QUALI  | Qualifying          | blue tint       |
| `race`              | RACE   | Grand Prix          | red tint        |

### Row layout
```
[ day col (52px) ] [ badge ] [ full name (flex-1) ] [ local time (monospace, right) ]
```

Day col shows short weekday + date number on the first session of a day; blank for subsequent sessions on the same day.

Badge uses `var(--f1-red)` with a low-opacity red background for practice/sprint sessions, blue for qualifying, and a stronger red for race.

Time formatted with `Intl.DateTimeFormat` — `hour: "2-digit"`, `minute: "2-digit"`, `hour12: false` in the detected timezone.

### Placement in page
Inserted between the event hero card and the Actual Results card.

---

## Section 3 — Actual Results: driver cards

Replace the current flat `grid-cols-5` of code labels with a row of driver cards.

### Card structure (per position)
```
┌─────────────────┐
│ [team color bar] │  3px top border in driver.team_colour
│                 │
│   [ avatar ]    │  36px circle — headshot_url via <FallbackImage>, fallback: driver code as text
│                 │
│     Pole        │  position label, muted
│     VER         │  driver code, bold white
└─────────────────┘
```

### Layout
- Desktop: `grid-cols-5` (5 positions on one row)
- Mobile: `grid-cols-3` with the last two cards wrapping (or `flex-wrap`) — no horizontal scroll

### Driver data
`team_colour` and `headshot_url` come from the expanded drivers query (Section 1). A `driversMap` is updated to carry `{ code, teamColour, headshotUrl }`.

### Sprint events
If `event.is_sprint`, two additional cards are appended below in a separate row: Sprint Pole and Sprint P1.

---

## Section 4 — Predictions table: team color dots

The existing `DataTable` is unchanged. The `resultCell` helper is updated:

```tsx
// Before: returns driver code string or styled <span>
// After: prepends a small colored dot

<span className={...}>
  <span
    style={{ background: teamColour ?? "transparent" }}
    className="inline-block w-[7px] h-[7px] rounded-full mr-1 align-middle flex-none"
  />
  {code} {correct ? "✓" : ""}
</span>
```

`driversMap` is updated to `Map<string, { code: string; teamColour: string | null }>` so `resultCell` can read the team color alongside the code. The correct/incorrect emerald/dimmed styling is unchanged.

---

## Files Changed

| File | Change |
|------|--------|
| `src/app/events/[eventId]/predictions/page.tsx` | Expand driver + sessions queries; add `SessionSchedule`; replace results grid; update `resultCell` |
| `src/components/SessionSchedule.tsx` | New file — weekend schedule client component |

No new dependencies. No schema changes. No RLS changes.

---

## Non-goals

- Full race results (P1–P20 standings) — out of scope
- Headshots in predictions table cells (too wide on mobile)
- Timezone selector UI — browser timezone auto-detected silently
