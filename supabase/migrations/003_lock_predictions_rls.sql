DROP POLICY IF EXISTS "Users insert own predictions" ON predictions;
DROP POLICY IF EXISTS "Users update own predictions" ON predictions;

CREATE POLICY "Users insert own predictions when unlocked" ON predictions
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND NOT (SELECT e.predictions_locked FROM events e WHERE e.id = event_id)
    AND (SELECT e.date FROM events e WHERE e.id = event_id) > CURRENT_DATE
  );

CREATE POLICY "Users update own predictions when unlocked" ON predictions
  FOR UPDATE
  USING (
    auth.uid() = user_id
    AND NOT (SELECT e.predictions_locked FROM events e WHERE e.id = event_id)
    AND (SELECT e.date FROM events e WHERE e.id = event_id) > CURRENT_DATE
  );
