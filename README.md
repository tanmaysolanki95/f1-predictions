# F1 Predictions

A competitive F1 predictions tracker for friends. Pick your qualifying pole, podium, and P10 for each race weekend — sprint rounds included. See how your picks stack up on the season leaderboard.

## Stack

- **Framework**: Next.js 16 (App Router, React 19)
- **Database & Auth**: Supabase (Postgres, Row Level Security, Auth)
- **Styling**: Tailwind CSS 4 + custom F1 design system
- **Deployment**: Vercel
- **Scoring**: Automated via GitHub Actions + Jolpica F1 API
- **F1 Assets**: Country flags via flagcdn.com, circuit layouts and team logos via Formula 1 CDN

## Getting Started

```bash
npm install
cp .env.example .env.local   # fill in your Supabase credentials
npm run dev                   # http://localhost:3000
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Yes | Supabase anon/publishable key |
| `NEXT_PUBLIC_SITE_URL` | Yes (prod) | Production URL — used for password reset emails |
| `SUPABASE_SERVICE_ROLE_KEY` | Scripts only | Service role key for `scripts/fetch-and-score.ts` |

## Database Setup

Run migrations in order against your Supabase project (SQL Editor):

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_allowlist_and_driver_images.sql
supabase/migrations/003_user_signups.sql
supabase/migrations/004_lock_predictions_rls.sql
```

## Scoring

Results are fetched from the Jolpica F1 API and scored automatically:

- **Automated**: GitHub Actions runs after each race (Sunday 18:00 UTC) and sprint (Saturday 16:00 UTC). Targets the most recently completed race (6-hour buffer after race start time).
- **Manual**: `ROUND=5 SEASON=2026 npx tsx scripts/fetch-and-score.ts` for a specific round
- **Backfill**: `ROUND=all SEASON=2026 npx tsx scripts/fetch-and-score.ts` to score all completed events in a season. Also available via GitHub Actions workflow dispatch (set round to `all`).

## Project Structure

```
src/
├── app/
│   ├── page.tsx                          # Dashboard (countdown timer, circuit image, leaderboard)
│   ├── events/                           # Season events list (flags, past/next status)
│   │   └── [eventId]/
│   │       ├── predict/                  # Prediction form
│   │       └── predictions/              # All users' picks for an event
│   ├── leaderboard/                      # Season standings (season selector)
│   ├── results/                          # Race results (event selector, Race/Sprint tabs)
│   ├── profile/[userId]/                 # User profile (picks + scores by season)
│   ├── auth/                             # Login, signup, password reset/change
│   └── api/health/                       # Health endpoint (Supabase keep-alive cron)
├── components/
│   ├── Button.tsx                        # Primary/secondary/ghost variants, auto-loading on nav
│   ├── Card.tsx                          # Glass-morphism card container
│   ├── Badge.tsx                         # Status badges (sprint, open, locked, points)
│   ├── Nav.tsx                           # Top navigation (receives user from server layout)
│   ├── DataTable.tsx                     # Responsive data table with scroll indicators
│   ├── EventCard.tsx                     # Race card (flag images, past/next status)
│   ├── DriverCard.tsx                    # Driver display (headshot, team logo, team color)
│   ├── RaceCountdown.tsx                 # Live d|h|m|s countdown to next session
│   ├── FallbackImage.tsx                 # Image with graceful error fallback
│   ├── NavigableSelect.tsx               # URL-driven select (search param navigation)
│   ├── ResultsTabs.tsx                   # Race/Sprint tabbed results view
│   ├── DriverSelect.tsx                  # Driver dropdown selector
│   └── DriverPickerModal.tsx             # Full-screen driver picker
├── lib/
│   ├── supabase/                         # Server + client Supabase clients
│   ├── jolpica/                          # F1 API client + mappers
│   ├── scoring/                          # Score computation engine
│   ├── teamColors.ts                     # F1 team color hex values
│   ├── countryFlags.ts                   # Country name → flagcdn.com URL
│   ├── circuitImages.ts                  # Circuit ID → F1 CDN track layout URL
│   └── teamLogos.ts                      # Team name → F1 CDN logo URL
├── types/
│   └── database.ts                       # TypeScript types mirroring DB schema
scripts/
└── fetch-and-score.ts                    # CLI: fetch results + compute scores
vercel.json                               # Cron: weekly health ping (prevents Supabase pause)
```

## Free Tier Optimizations

This app is designed to stay within Supabase Free and Vercel Hobby tier limits:

- **Auth**: Middleware uses `getSession()` (reads cookie locally) instead of `getUser()` (network round-trip) to avoid hitting Supabase auth API on every request
- **Nav**: Receives user info as props from the server layout — no client-side auth call on navigation
- **Results**: Session results consolidated into a single bulk query with JS-side filtering
- **Keep-alive**: Weekly cron at `/api/health` prevents Supabase free tier inactivity pause (7-day limit)
- **Images**: External CDN images (flags, circuits, logos) use `<FallbackImage>` with graceful degradation — no `next/image` optimization quota consumed

## Deployment

1. Push to GitHub → Vercel auto-deploys
2. Set env vars in Vercel (Settings → Environment Variables)
3. Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` as GitHub repo secrets for the scoring workflow
4. Configure Supabase Auth redirect URLs to include your production domain
5. The `vercel.json` cron runs automatically on deploy — pings `/api/health` weekly to keep Supabase alive
