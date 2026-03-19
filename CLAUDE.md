@AGENTS.md

## Build & Dev Commands

- `npm run dev` — Start dev server
- `npm run build` — Production build (also runs TypeScript checking)
- `npm run lint` — ESLint
- `npx tsx scripts/fetch-and-score.ts` — Fetch race results and compute scores (requires SUPABASE_SERVICE_ROLE_KEY)

## Quick Reference

- Types: `src/types/database.ts`
- Team colors: `src/lib/teamColors.ts`
- Design tokens: `src/app/globals.css`
- Supabase clients: `src/lib/supabase/server.ts` (server) and `src/lib/supabase/client.ts` (browser)
- Auth actions: `src/app/auth/actions.ts`
- Migrations: `supabase/migrations/` (numbered, run in order)

## When Making Changes

- Run `npm run build` after changes to verify — it catches TypeScript errors
- Use `Button` component (not raw `<button>`) for all interactive elements
- Use `Card` component for content sections
- Use `Badge` for status indicators (tones: open, sprint, locked, points)
- Use `.maybeSingle()` not `.single()` for Supabase queries that may return 0 rows
- Wrap `cookies().set()` calls in try/catch in Server Components
- Add new Supabase env var references with `?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` fallback
