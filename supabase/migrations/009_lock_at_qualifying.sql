-- supabase/migrations/009_lock_at_qualifying.sql
-- Change prediction lock boundary from FP1 to qualifying session.
-- Falls back to events.date::TIMESTAMPTZ (midnight UTC on race day)
-- if no qualifying session exists.

DROP POLICY IF EXISTS "Users insert own predictions when unlocked" ON predictions;
DROP POLICY IF EXISTS "Users update own predictions when unlocked" ON predictions;

CREATE POLICY "Users insert own predictions when unlocked" ON predictions
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND NOT (SELECT e.predictions_locked FROM events e WHERE e.id = predictions.event_id)
    AND COALESCE(
      (
        SELECT (es.date || 'T' || es.time)::TIMESTAMPTZ
        FROM event_sessions es
        WHERE es.event_id = predictions.event_id
          AND es.session_type = 'qualifying'
      ),
      (SELECT e.date FROM events e WHERE e.id = predictions.event_id)::TIMESTAMPTZ
    ) > NOW()
  );

CREATE POLICY "Users update own predictions when unlocked" ON predictions
  FOR UPDATE
  USING (
    auth.uid() = user_id
    AND NOT (SELECT e.predictions_locked FROM events e WHERE e.id = predictions.event_id)
    AND COALESCE(
      (
        SELECT (es.date || 'T' || es.time)::TIMESTAMPTZ
        FROM event_sessions es
        WHERE es.event_id = predictions.event_id
          AND es.session_type = 'qualifying'
      ),
      (SELECT e.date FROM events e WHERE e.id = predictions.event_id)::TIMESTAMPTZ
    ) > NOW()
  );
