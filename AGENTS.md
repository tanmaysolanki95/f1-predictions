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
- Button system: `import Button from "@/components/Button"` — variants: primary/secondary/ghost, sizes: sm/md/lg

### Data Model

- `events.date` + `events.time` determine when an event starts
- Predictions lock automatically when `predictions_locked = true` OR event date has passed
- RLS enforces this server-side (migration 004)
- Driver IDs follow Jolpica format: `max_verstappen`, `russell`, `leclerc`
- Prediction categories map to DB columns via `PREDICTION_COLUMN_MAP` in `types/database.ts`

### Auth

- Middleware at `src/middleware.ts` protects all non-`/auth/*` routes
- Password reset flow: forgot-password → email → callback → reset-password
- Server actions in `src/app/auth/actions.ts`: login, signup, logout, resetPassword, updatePassword

### Pages

All dynamic pages use `cookies()` to opt out of static generation. Use `.maybeSingle()` instead of `.single()` for queries that may return 0 rows.

## Do NOT

- Use `as any`, `@ts-ignore`, or `@ts-expect-error`
- Add animation libraries (CSS-only animations throughout)
- Suppress linter or type errors
- Use inline styles where Tailwind classes suffice
- Change RLS policies without a new numbered migration file
