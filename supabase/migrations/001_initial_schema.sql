-- F1 Predictions Tracker — Initial Schema
-- Run against Supabase Postgres (or any Postgres 15+)

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT NOT NULL,
  invite_code   TEXT,              -- optional: track who invited whom
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- SEASONS
-- ============================================================
CREATE TABLE seasons (
  year  INTEGER PRIMARY KEY
);

-- ============================================================
-- DRIVERS
-- ============================================================
CREATE TABLE drivers (
  id          TEXT PRIMARY KEY,   -- Jolpica driverId e.g. 'max_verstappen'
  code        TEXT NOT NULL,      -- 3-letter code e.g. 'VER'
  first_name  TEXT NOT NULL,
  last_name   TEXT NOT NULL,
  team        TEXT,               -- current constructor name
  nationality TEXT,
  number      TEXT                -- permanent car number
);

-- ============================================================
-- EVENTS (each race weekend)
-- ============================================================
CREATE TABLE events (
  id            SERIAL PRIMARY KEY,
  season_year   INTEGER NOT NULL REFERENCES seasons(year),
  round         INTEGER NOT NULL,
  name          TEXT NOT NULL,              -- e.g. 'Bahrain Grand Prix'
  circuit_id    TEXT NOT NULL,              -- e.g. 'bahrain'
  circuit_name  TEXT NOT NULL,
  country       TEXT NOT NULL,
  date          DATE NOT NULL,             -- race day
  time          TEXT,                      -- race start UTC e.g. '15:00:00Z'
  is_sprint     BOOLEAN NOT NULL DEFAULT FALSE,
  predictions_locked BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(season_year, round)
);

-- ============================================================
-- SESSION RESULTS (qualifying, race, sprint — all positions)
-- ============================================================
CREATE TABLE session_results (
  id            SERIAL PRIMARY KEY,
  event_id      INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  session_type  TEXT NOT NULL CHECK (session_type IN ('qualifying', 'race', 'sprint')),
  driver_id     TEXT NOT NULL REFERENCES drivers(id),
  position      INTEGER NOT NULL,
  status        TEXT,            -- 'Finished', 'DNF', '+1 Lap', etc.
  grid          INTEGER,         -- starting grid position
  points        NUMERIC(4,1),    -- official F1 points awarded
  fetched_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, session_type, driver_id)
);

CREATE INDEX idx_session_results_lookup
  ON session_results(event_id, session_type, position);

-- ============================================================
-- PREDICTIONS
-- One row per user per event. Each column holds a driver_id.
-- NULL sprint columns for non-sprint weekends.
-- ============================================================
CREATE TABLE predictions (
  id                       SERIAL PRIMARY KEY,
  user_id                  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id                 INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,

  -- Race qualifying predictions
  race_pole_driver_id      TEXT REFERENCES drivers(id),   -- who gets P1 in qualifying

  -- Race result predictions
  race_p1_driver_id        TEXT REFERENCES drivers(id),   -- predicted race winner
  race_p2_driver_id        TEXT REFERENCES drivers(id),   -- predicted P2
  race_p3_driver_id        TEXT REFERENCES drivers(id),   -- predicted P3
  race_p10_driver_id       TEXT REFERENCES drivers(id),   -- predicted P10

  -- Sprint predictions (NULL for non-sprint weekends)
  sprint_pole_driver_id    TEXT REFERENCES drivers(id),   -- sprint qualifying P1
  sprint_p1_driver_id      TEXT REFERENCES drivers(id),   -- sprint race P1
  sprint_p2_driver_id      TEXT REFERENCES drivers(id),   -- sprint race P2
  sprint_p3_driver_id      TEXT REFERENCES drivers(id),   -- sprint race P3
  sprint_p10_driver_id     TEXT REFERENCES drivers(id),   -- sprint race P10

  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, event_id)
);

-- ============================================================
-- SCORES (computed after results come in)
-- ============================================================
CREATE TABLE scores (
  id                       SERIAL PRIMARY KEY,
  user_id                  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id                 INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,

  -- Individual category scores (0 or 1 each)
  race_pole_points         INTEGER NOT NULL DEFAULT 0,
  race_p1_points           INTEGER NOT NULL DEFAULT 0,
  race_p2_points           INTEGER NOT NULL DEFAULT 0,
  race_p3_points           INTEGER NOT NULL DEFAULT 0,
  race_p10_points          INTEGER NOT NULL DEFAULT 0,
  sprint_pole_points       INTEGER NOT NULL DEFAULT 0,
  sprint_p1_points         INTEGER NOT NULL DEFAULT 0,
  sprint_p2_points         INTEGER NOT NULL DEFAULT 0,
  sprint_p3_points         INTEGER NOT NULL DEFAULT 0,
  sprint_p10_points        INTEGER NOT NULL DEFAULT 0,

  total_points             INTEGER NOT NULL DEFAULT 0,    -- sum of above
  computed_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, event_id)
);

-- ============================================================
-- LEADERBOARD VIEW
-- ============================================================
CREATE OR REPLACE VIEW leaderboard AS
  SELECT
    p.id AS user_id,
    p.display_name,
    COALESCE(SUM(s.total_points), 0) AS total_points,
    COUNT(DISTINCT s.event_id) AS events_scored,
    RANK() OVER (ORDER BY COALESCE(SUM(s.total_points), 0) DESC) AS rank
  FROM profiles p
  LEFT JOIN scores s ON s.user_id = p.id
  GROUP BY p.id, p.display_name;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;

-- Everyone can read everything (it's a friends app)
CREATE POLICY "Anyone can read profiles"     ON profiles        FOR SELECT USING (true);
CREATE POLICY "Anyone can read events"       ON events          FOR SELECT USING (true);
CREATE POLICY "Anyone can read drivers"      ON drivers         FOR SELECT USING (true);
CREATE POLICY "Anyone can read results"      ON session_results FOR SELECT USING (true);
CREATE POLICY "Anyone can read scores"       ON scores          FOR SELECT USING (true);
CREATE POLICY "Anyone can read seasons"      ON seasons         FOR SELECT USING (true);
CREATE POLICY "Anyone can read predictions"  ON predictions     FOR SELECT USING (true);

-- Users can only modify their own data
CREATE POLICY "Users update own profile"     ON profiles    FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own predictions" ON predictions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own predictions" ON predictions FOR UPDATE USING (auth.uid() = user_id);
