# F1 Predictions

A competitive F1 predictions tracker for friends. Pick your qualifying pole, podium, and P10 for each race weekend — sprint rounds included. See how your picks stack up on the season leaderboard.

## Stack

- **Framework**: Next.js 16 (App Router, React 19)
- **Database & Auth**: Supabase (Postgres, Row Level Security, Auth)
- **Styling**: Tailwind CSS 4 + custom F1 design system
- **Deployment**: Vercel
- **Scoring**: Automated via GitHub Actions + Jolpica F1 API

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

- **Automated**: GitHub Actions runs after each race (Sunday 18:00 UTC) and sprint (Saturday 16:00 UTC)
- **Manual**: `npx tsx scripts/fetch-and-score.ts` with `SEASON` and `ROUND` env vars
- **Backfill**: Trigger the GitHub Action manually with a specific round number

## Project Structure

```
src/
├── app/
│   ├── page.tsx                          # Dashboard (next race, leaderboard preview)
│   ├── events/                           # Season events list
│   │   └── [eventId]/
│   │       ├── predict/                  # Prediction form
│   │       └── predictions/              # All users' picks for an event
│   ├── leaderboard/                      # Season standings
│   ├── results/                          # Race results
│   ├── profile/[userId]/                 # User profile (picks + scores by season)
│   └── auth/                             # Login, signup, password reset/change
├── components/                           # Shared UI (Button, Card, Badge, Nav, etc.)
├── lib/
│   ├── supabase/                         # Server + client Supabase clients
│   ├── jolpica/                          # F1 API client + mappers
│   ├── scoring/                          # Score computation engine
│   └── teamColors.ts                     # F1 team color registry
├── types/
│   └── database.ts                       # TypeScript types mirroring DB schema
scripts/
└── fetch-and-score.ts                    # CLI: fetch results + compute scores
```

## Deployment

1. Push to GitHub → Vercel auto-deploys
2. Set env vars in Vercel (Settings → Environment Variables)
3. Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` as GitHub repo secrets for the scoring workflow
4. Configure Supabase Auth redirect URLs to include your production domain
