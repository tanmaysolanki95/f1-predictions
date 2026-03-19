<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# F1 Predictions — Agent Context

## Architecture

- Next.js 16 App Router with React 19 Server Components
- Supabase for auth + Postgres database with Row Level Security
- Tailwind CSS 4 with custom F1 design system (CSS custom properties in `globals.css`)
- No component library — all components are hand-built in `src/components/`
- External images from flagcdn.com (flags), formula1.com CDN (circuits, logos) via `<FallbackImage>`

## Key Conventions

### Supabase Client

Two clients exist — use the right one:
- **Server Components / Route Handlers**: `import { createClient } from "@/lib/supabase/server"` — uses `cookies()` for session
- **Client Components**: `import { createClient } from "@/lib/supabase/client"` — uses browser client

The server client wraps `cookies().set()` in try/catch because it throws in Server Components. The middleware handles token refresh.

The project supports two env var names for the Supabase key: `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`. Both are checked with `??` fallback.

### Styling

- Design tokens are CSS custom properties in `src/app/globals.css` (not Tailwind config)
- F1 heading font: `var(--font-titillium)` (Titillium Web) — use for headings, numbers, badges
- Body font: Geist Sans (default)
- Team colors: `import { teamColorHex, resolveTeamColor } from "@/lib/teamColors"` — single source of truth
- Racing motif classes: `.racing-stripe-bg`, `.carbon-fiber-bg`, `.checkered-bg`
- Animation classes: `.animate-fade-in`, `.animate-slide-up`, `.animate-press`, `.animate-pulse-glow`, `.skeleton`
- Countdown timer classes: `.countdown`, `.countdown-segment`, `.countdown-value`, `.countdown-label`, `.countdown-separator`
- Circuit background: `.circuit-bg` — absolutely positioned, 7% opacity decorative overlay with mask gradient
- Button system: `import Button from "@/components/Button"` — variants: primary/secondary/ghost, sizes: sm/md/lg. Link buttons auto-show a spinner during navigation.

### F1 Asset Utilities

Three data-mapping utilities resolve names to CDN image URLs:
- `import { getCountryFlagUrl } from "@/lib/countryFlags"` — country name → flagcdn.com URL (returns `null` if unmapped)
- `import { getCircuitImageUrl } from "@/lib/circuitImages"` — Jolpica circuit_id → formula1.com track layout URL (returns `null` if unmapped)
- `import { getTeamLogoUrl } from "@/lib/teamLogos"` — team name → formula1.com team logo URL (returns `null` if unmapped)

All consumers must handle `null` returns gracefully. Use `<FallbackImage>` (client component with `onError` → hide) for external CDN images in Server Components — raw `<img onError>` is not allowed in Server Components.

### Data Model

- `events.date` + `events.time` determine when an event starts
- Predictions lock automatically when `predictions_locked = true` OR event date has passed
- RLS enforces this server-side (migration 004)
- Driver IDs follow Jolpica format: `max_verstappen`, `russell`, `leclerc`
- Prediction categories map to DB columns via `PREDICTION_COLUMN_MAP` in `types/database.ts`

### Auth

- Middleware at `src/middleware.ts` uses `getSession()` (cookie-only, no network call) to gate access
- The root layout (`src/app/layout.tsx`) calls `getUser()` once and passes `displayName` + `userId` to `<Nav>` — Nav does NOT make its own auth call
- Server actions in `src/app/auth/actions.ts` validate inputs (type, length) before calling Supabase: login, signup, logout, resetPassword, updatePassword
- Password reset flow: forgot-password → email → callback → reset-password
- The auth callback route validates the `next` parameter against open redirect (must start with `/`, must not start with `//`)

### Pages

All dynamic pages use `cookies()` to opt out of static generation. Use `.maybeSingle()` instead of `.single()` for queries that may return 0 rows.

- **Dashboard** (`/`): Live `<RaceCountdown>` targeting `event.date + event.time`, circuit layout as background overlay
- **Events** (`/events`): Country flag images via `<FallbackImage>`, past events dimmed (`opacity-50 grayscale`), next event highlighted with red glow, "View Results" link on completed events
- **Results** (`/results`): Event selector via `<NavigableSelect>` (`?event=` search param), Race/Sprint tabs via `<ResultsTabs>`, single bulk `session_results` query
- **Leaderboard** (`/leaderboard`): Season selector via `<NavigableSelect>` (`?season=` search param), per-season standings computed from scores + events join
- **Profile** (`/profile/[userId]`): Season tabs, per-event prediction breakdown

### Scoring Script

`scripts/fetch-and-score.ts` supports three modes via `ROUND` env var:
- `ROUND=last` (default): Scores the most recently completed race (race start + 6h buffer)
- `ROUND=all`: Backfills all completed races in the season (2s delay between API calls)
- `ROUND=5`: Scores a specific round number

### Free Tier Constraints

The app is optimized for Supabase Free + Vercel Hobby:
- Middleware uses `getSession()` not `getUser()` — avoids a network round-trip on every request
- Nav receives user props from server layout — no client-side `getUser()` on navigation
- `/api/health` + `vercel.json` cron pings weekly to prevent Supabase inactivity pause
- No `next/image` usage — plain `<img>` / `<FallbackImage>` avoids Vercel image optimization quota (5K transforms/month on Hobby)

## Do NOT

- Use `as any`, `@ts-ignore`, or `@ts-expect-error`
- Add animation libraries (CSS-only animations throughout)
- Suppress linter or type errors
- Use inline styles where Tailwind classes suffice
- Change RLS policies without a new numbered migration file
- Use `<img onError>` in Server Components — use `<FallbackImage>` instead
- Call `supabase.auth.getUser()` in middleware or client-side Nav — use `getSession()` in middleware, props from layout for Nav
- Use `next/image` for external CDN images — uses optimization quota
