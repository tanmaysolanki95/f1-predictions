# F1 Predictions

A competitive F1 predictions tracker for friends. Pick your qualifying pole, podium, and P10 for each race weekend — sprint qualifying and sprint winner included. See how your picks stack up on the season leaderboard.

## Stack

- **Framework**: Next.js 16 (App Router, React 19 Server Components)
- **Database & Auth**: Supabase (Postgres, Row Level Security, Auth)
- **Styling**: Tailwind CSS 4 + custom F1 design system (CSS custom properties)
- **Deployment**: Vercel (Hobby tier)
- **Scoring**: Automated via GitHub Actions + Jolpica F1 API
- **F1 Assets**: Country flags via flagcdn.com, circuit layouts and team logos via Formula 1 CDN
- **News Feed**: Motorsport.com RSS with server-side parsing and 15-minute ISR cache

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
supabase/migrations/003_lock_predictions_rls.sql
supabase/migrations/004_tighten_role_grants.sql
```

## Features

### Public Browsing
- **No login required**: Dashboard, events, leaderboard, news, predictions, and profiles are all viewable without an account
- **Auth-gated actions**: Only the prediction form and change-password page require authentication — enforced by middleware with a server-side safety net
- **Redirect flow**: Unauthenticated users hitting a protected page are redirected to login with a `?redirect=` param, then returned to their original page after sign-in
- **Smart Nav**: Shows "Sign in" link for anonymous visitors; shows user info + sign out/change password/profile for authenticated users

### Predictions
- **Race predictions**: Qualifying Pole, P1, P2, P3, P10
- **Sprint predictions** (sprint weekends only): Sprint Qualifying Pole, Sprint P1
- **Duplicate prevention**: Race positions P1–P10 must be unique drivers (pole excluded from this check)
- **Smart routing**: Dashboard CTA adapts based on auth and prediction state — anonymous users see "View Predictions" + "Sign in to Predict"; authenticated users see "Make Predictions" or "View Predictions" + "Edit Picks". Users who already predicted are redirected from the predict form to the predictions view unless they explicitly click "Edit Picks" (`?edit`)

### Dashboard
- **Live countdown timer**: Days, hours, minutes, seconds to the next race start with Titillium Web digit boxes
- **Circuit image overlay**: Track layout from Formula 1 CDN as a decorative background on the hero card
- **Leaderboard preview**: Top 5 standings
- **Season progress**: Completed rounds count
- **F1 news feed**: Latest 5 headlines from Motorsport.com with time-ago indicators

### Events
- **Country flag images**: Real flags from flagcdn.com on each event card
- **Visual status**: Past events dimmed (opacity + grayscale), next event highlighted with red glow
- **Smart card links**: Completed events → predictions + results view, upcoming events → predict form (authenticated) or predictions view (anonymous)

### Predictions + Results (Combined View)
- **Picks table**: All users' predictions for the event
- **Actual results card** (completed events): Shows the real pole, podium, P10 results
- **Correct/incorrect highlighting**: Correct picks in emerald green with ✓, incorrect dimmed with ✗
- **Points column**: Per-user total points when results are available
- **Hero header**: Circuit image, country flag, round badge, racing-stripe background
- **Context-aware back button**: Returns to dashboard, events, or leaderboard based on where you came from (`?from=` param)

### Leaderboard
- **Season selector**: Browse standings for any season via URL search params
- **Per-season standings**: Computed from scores + events join with client-side aggregation

### News
- **Full news page** (`/news`): 20 article cards with thumbnails, descriptions, category badges, time-ago
- **Dashboard card**: Compact 5-headline preview with "View All News →" link
- **ISR cached**: Revalidates every 15 minutes — minimal Vercel function cost

### Profile
- **Season tabs**: View picks and scores per season
- **Per-event breakdown**: Prediction details and scoring for each race
- **Browser history back button**: Returns to wherever you navigated from

### Visual Enhancements
- **P1 logo**: SVG favicon and nav bar mark — red rounded square with bold white "P1" monogram
- **Sticky navigation**: Nav bar stays pinned at the top while scrolling
- **Team logos**: Circular team logos from Formula 1 CDN on driver cards
- **Button loading spinners**: Link-based buttons auto-show a spinner on click, clear when navigation completes (8s safety timeout)
- **Racing motif CSS**: `.racing-stripe-bg`, `.carbon-fiber-bg`, `.checkered-bg` classes
- **Circuit background variants**: `.circuit-bg` (subtle, 15% opacity) and `.circuit-bg--hero` (prominent, 40% opacity with edge fade)

## Season Refresh

Pre-season data (drivers, events, calendar) is loaded from the Jolpica F1 API:

- **Automated**: GitHub Actions runs Feb 1 at 12:00 UTC — derives the current year automatically
- **Manual**: `SEASON=2027 npx tsx scripts/refresh-season.ts` or trigger via GitHub Actions workflow dispatch
- **Idempotent**: Safe to run multiple times — upserts season, events, and drivers without overwriting manually-set headshot URLs or team colours
- **Team info**: Pulls driver-team associations from current season standings; falls back to the previous season if standings aren't available yet (pre-season)

## Scoring

Results are fetched from the Jolpica F1 API and scored automatically:

- **Automated**: GitHub Actions runs after each race (Sunday 18:00 UTC) and sprint (Saturday 16:00 UTC). Targets the most recently completed race (race start + 6-hour buffer).
- **Manual**: `ROUND=5 SEASON=2026 npx tsx scripts/fetch-and-score.ts` for a specific round
- **Backfill**: `ROUND=all SEASON=2026 npx tsx scripts/fetch-and-score.ts` to score all completed events in a season (2s delay between API calls). Also available via GitHub Actions workflow dispatch (set round to `all`).

### Scoring Rules
Each correct prediction earns 1 point. Categories scored:
- **Race**: Qualifying Pole, P1, P2, P3, P10 (5 possible points)
- **Sprint** (sprint weekends): Sprint Qualifying Pole, Sprint P1 (2 possible points)

## Project Structure

```
src/
├── app/
│   ├── icon.svg                          # P1 logo (SVG favicon)
│   ├── page.tsx                          # Dashboard (countdown, circuit, leaderboard, news)
│   ├── events/                           # Season events list (flags, past/next status)
│   │   └── [eventId]/
│   │       ├── predict/                  # Prediction form (with duplicate validation)
│   │       └── predictions/              # Picks + results for an event (combined view)
│   ├── leaderboard/                      # Season standings (season selector)
│   ├── news/                             # F1 news feed (Motorsport.com RSS, ISR cached)
│   ├── profile/[userId]/                 # User profile (picks + scores by season)
│   ├── auth/                             # Login, signup, password reset/change
│   └── api/health/                       # Health endpoint (Supabase keep-alive cron)
├── components/
│   ├── BackButton.tsx                    # Browser history back (router.back())
│   ├── Badge.tsx                         # Status badges (sprint, open, locked, points)
│   ├── Button.tsx                        # Primary/secondary/ghost, auto-loading on navigation
│   ├── Card.tsx                          # Glass-morphism card container
│   ├── DataTable.tsx                     # Responsive data table
│   ├── DriverCard.tsx                    # Driver display (headshot, team logo, team color)
│   ├── DriverPickerModal.tsx             # Full-screen driver picker for predictions
│   ├── DriverSelect.tsx                  # Driver dropdown selector
│   ├── EventCard.tsx                     # Race card (flag, past/next status, round badge)
│   ├── FallbackImage.tsx                 # Image with graceful error fallback (use client)
│   ├── Nav.tsx                           # Sticky top nav (user props from layout, P1 logo)
│   ├── NavigableSelect.tsx               # URL-driven select (search param navigation)
│   └── RaceCountdown.tsx                 # Live d|h|m|s countdown to next session
├── lib/
│   ├── supabase/                         # Server + client Supabase clients
│   ├── jolpica/                          # F1 API client + mappers
│   ├── scoring/                          # Score computation engine
│   ├── newsFeed.ts                       # Motorsport.com RSS fetcher (zero dependencies)
│   ├── teamColors.ts                     # F1 team color hex values
│   ├── countryFlags.ts                   # Country name → flagcdn.com URL
│   ├── circuitImages.ts                  # Circuit ID → F1 CDN track layout URL
│   └── teamLogos.ts                      # Team name → F1 CDN logo URL
├── types/
│   └── database.ts                       # TypeScript types mirroring DB schema
scripts/
└── fetch-and-score.ts                    # CLI: fetch results + compute scores (3 modes)
vercel.json                               # Cron: weekly health ping (prevents Supabase pause)
```

## Free Tier Optimizations

This app is designed to stay within Supabase Free and Vercel Hobby tier limits:

- **Auth**: Middleware only gates write-action routes (`/events/*/predict`, `/auth/change-password`) — most pages are publicly accessible. Uses `getUser()` to validate sessions and clears stale `sb-*` cookies on redirect
- **Nav**: Receives user info as props from the server layout — no client-side auth call on navigation
- **Query parallelization**: All pages use `Promise.all` for independent queries (dashboard: 5 parallel, predictions: 7 parallel, leaderboard: 2+2 parallel)
- **Predictions page**: Session results consolidated into a single bulk query with JS-side filtering
- **News feed**: ISR with 15-minute revalidation — ~96 RSS fetches/day, negligible bandwidth
- **Keep-alive**: Weekly cron at `/api/health` prevents Supabase free tier inactivity pause (7-day limit)
- **Images**: External CDN images (flags, circuits, logos) use `<FallbackImage>` with graceful degradation — no `next/image` optimization quota consumed

## Deployment

1. Push to GitHub → Vercel auto-deploys
2. Set env vars in Vercel (Settings → Environment Variables)
3. Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` as GitHub repo secrets for the scoring workflow
4. Configure Supabase Auth redirect URLs to include your production domain
5. The `vercel.json` cron runs automatically on deploy — pings `/api/health` weekly to keep Supabase alive
