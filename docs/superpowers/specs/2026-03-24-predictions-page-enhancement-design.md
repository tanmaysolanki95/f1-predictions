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

### Change: unified `driversMap` type

A single map replaces the current `Map<string, string>` (code only):

```ts
type DriverInfo = { code: string; teamColour: string | null; headshotUrl: string | null };
const driversMap = new Map<string, DriverInfo>();
```

Both the Actual Results card (Section 3) and `resultCell` (Section 4) read from this same map.

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

Badge styles are locally-scoped Tailwind utility classes inside `SessionSchedule` — the existing `Badge` component is **not** used here (its tones don't map to these session types). Practice/sprint sessions use a low-opacity red pill (`bg-[var(--f1-red)]/15 text-[var(--f1-red)]`), qualifying uses a blue pill, and race uses a stronger red pill.

Time formatted with `Intl.DateTimeFormat` — `hour: "2-digit"`, `minute: "2-digit"`, `hour12: false` in the detected timezone. Session date+time must be combined as `new Date(\`${date}T${time}\`)` (proper ISO string) for reliable parsing and sorting.

### Empty sessions guard

If the sessions array is empty (e.g. the season refresh script has not run yet for this event), `SessionSchedule` renders nothing — the component returns `null`. The FP1 lock-time fallback (`new Date(\`${event.date}T00:00:00Z\`)`) remains in place by filtering `sessions` for `session_type === "fp1"` before accessing `.date`/`.time`.

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
If `event.is_sprint`, two additional cards are appended below in a separate row: Sprint Pole and Sprint P1. Sprint Pole and Sprint P1 cards follow the same `grid-cols-2` layout as the existing sprint section.

**Known limitation:** Assign `actualSprintPole` as `null` directly:

```ts
const actualSprintPole = null;
```

The current page derives it from `qualResults` (main qualifying), which is a pre-existing bug — it returns the regular qualifying pole sitter rather than sprint qualifying pole. Sprint qualifying results are not stored in `session_results` at all (the scoring script only stores `"qualifying"`, `"race"`, and `"sprint"` session types). Fixing this properly requires adding sprint qualifying fetching to the scoring script, a new `"sprint_qualifying"` value in the `SessionType` union, and scoring engine changes — out of scope for this spec. Explicitly assigning `null` removes the pre-existing wrong derivation.

### Avatar rendering

For each driver in the results card:
- If `headshotUrl` is `null`: render a code-initial circle directly (no `FallbackImage`).
- If `headshotUrl` is non-null: render `<FallbackImage src={headshotUrl} fallback={<CodeCircle />} />` so a load failure falls back to the code circle gracefully.

---

## Section 4 — Predictions table: team color dots

The existing `DataTable` is unchanged. The `resultCell` function signature changes — the `map` parameter type changes from `Map<string, string>` to `Map<string, DriverInfo>`:

```ts
function resultCell(
  driverId: string | null,
  actualId: string | null,
  map: Map<string, DriverInfo>,
  show: boolean,
): React.ReactNode
```

The rendering is updated:

```tsx
// Before: returns driver code string or styled <span>
// After: prepends a small colored dot

<span className={...}>
  <span
    style={{ background: teamColour ? `#${teamColour}` : "transparent" }}
    className="inline-block w-[7px] h-[7px] rounded-full mr-1 align-middle flex-none"
    aria-hidden="true"
  />
  {code} {correct ? "✓" : ""}
</span>
```

`team_colour` in the DB is a hex string **without** the `#` prefix (e.g. `"3671C6"`). Always prepend `#` when using it as a CSS color value. The `driversMap` type is the unified `DriverInfo` map defined in Section 1. The correct/incorrect emerald/dimmed styling is unchanged.

---

## Section 5 — Route move: `/events/[eventId]/predictions` → `/events/[eventId]`

The predictions/event detail page moves from the `/predictions` sub-route to the event root.

### File moves
- `src/app/events/[eventId]/predictions/page.tsx` → `src/app/events/[eventId]/page.tsx`
- `src/app/events/[eventId]/predictions/loading.tsx` → `src/app/events/[eventId]/loading.tsx`
- Delete the now-empty `src/app/events/[eventId]/predictions/` directory (note: `predict/` is a sibling sub-route under `[eventId]/` and is unaffected)

### Link updates (7 references across 4 files)

| File | Old | New |
|------|-----|-----|
| `src/app/page.tsx` (3×) | `/events/${id}/predictions?from=/` | `/events/${id}?from=/` |
| `src/app/events/page.tsx` | `/events/${ev.id}/predictions?from=/events` | `/events/${ev.id}?from=/events` |
| `src/app/events/[eventId]/predict/page.tsx` | `/events/${eventId}/predictions?from=/` | `/events/${eventId}?from=/` |
| `src/app/events/[eventId]/predict/PredictionForm.tsx` | `/events/${event.id}/predictions?from=/events` | `/events/${event.id}?from=/events` |

The `VALID_BACK_PATHS` array and `?from=` back-nav logic inside the page are unchanged — those reference `/`, `/events`, and `/leaderboard`, not the predictions path.

---

## Files Changed

| File | Change |
|------|--------|
| `src/app/events/[eventId]/predictions/page.tsx` | **Move** to `src/app/events/[eventId]/page.tsx`; expand driver + sessions queries; add `SessionSchedule`; replace results grid; update `resultCell` |
| `src/app/events/[eventId]/predictions/loading.tsx` | **Move** to `src/app/events/[eventId]/loading.tsx` |
| `src/components/SessionSchedule.tsx` | New file — weekend schedule client component |
| `src/app/page.tsx` | Update 3 `/predictions` links |
| `src/app/events/page.tsx` | Update 1 `/predictions` link |
| `src/app/events/[eventId]/predict/page.tsx` | Update 1 `/predictions` redirect |
| `src/app/events/[eventId]/predict/PredictionForm.tsx` | Update 1 `/predictions` router.push |
| `src/app/events/[eventId]/loading.tsx` (moved) | Add skeleton section for `SessionSchedule` card (header + ~5 row skeletons using `.skeleton` class) |

No new dependencies. No schema changes. No RLS changes.

---

## Non-goals

- Full race results (P1–P20 standings) — out of scope
- Headshots in predictions table cells (too wide on mobile)
- Timezone selector UI — browser timezone auto-detected silently
