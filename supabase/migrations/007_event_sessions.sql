-- supabase/migrations/007_event_sessions.sql
-- Session schedule for each event (FP1, FP2, FP3, qualifying, sprint, race)

CREATE TABLE event_sessions (
  id           SERIAL PRIMARY KEY,
  event_id     INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL CHECK (session_type IN (
                  'fp1', 'fp2', 'fp3',
                  'sprint_qualifying', 'sprint_race',
                  'qualifying', 'race'
                )),
  date         DATE NOT NULL,
  time         TEXT NOT NULL,   -- HH:MM:SSZ UTC
  UNIQUE(event_id, session_type)
);

ALTER TABLE event_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read event sessions"
  ON event_sessions FOR SELECT USING (true);

-- Mirror migration 004: revoke write grants from authenticated
-- (service role only writes via refresh script)
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON event_sessions FROM authenticated;
