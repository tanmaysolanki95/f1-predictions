-- Backfill predictions for Landolorian and Sainz and Poortents.

-- ── Predictions ─────────────────────────────────────────────────────────────
-- User 1 — Week 1 (Australian GP, event_id=1, no sprint)
INSERT INTO predictions (
  user_id, event_id,
  race_pole_driver_id,
  race_p1_driver_id, race_p2_driver_id, race_p3_driver_id, race_p10_driver_id
) VALUES (
  '87251a31-1d08-4357-8681-38853c85fec1', 1,
  'russell',
  'russell', 'norris', 'max_verstappen', 'gasly'
) ON CONFLICT (user_id, event_id) DO NOTHING;

-- User 1 — Week 2 (Chinese GP, event_id=2, sprint weekend)
INSERT INTO predictions (
  user_id, event_id,
  sprint_pole_driver_id, sprint_p1_driver_id,
  race_pole_driver_id,
  race_p1_driver_id, race_p2_driver_id, race_p3_driver_id, race_p10_driver_id
) VALUES (
  '87251a31-1d08-4357-8681-38853c85fec1', 2,
  'antonelli', 'hamilton',
  'russell',
  'russell', 'antonelli', 'hamilton', 'hulkenberg'
) ON CONFLICT (user_id, event_id) DO NOTHING;

-- User 2 — Week 1 (Australian GP, event_id=1, no sprint)
INSERT INTO predictions (
  user_id, event_id,
  race_pole_driver_id,
  race_p1_driver_id, race_p2_driver_id, race_p3_driver_id, race_p10_driver_id
) VALUES (
  '2bd95abb-2a4d-466d-81e6-37eb7ff5e6c8', 1,
  'russell',
  'max_verstappen', 'russell', 'antonelli', 'bottas'
) ON CONFLICT (user_id, event_id) DO NOTHING;

-- User 2 — Week 2 (Chinese GP, event_id=2, sprint weekend)
INSERT INTO predictions (
  user_id, event_id,
  sprint_pole_driver_id, sprint_p1_driver_id,
  race_pole_driver_id,
  race_p1_driver_id, race_p2_driver_id, race_p3_driver_id, race_p10_driver_id
) VALUES (
  '2bd95abb-2a4d-466d-81e6-37eb7ff5e6c8', 2,
  'russell', 'leclerc',
  'russell',
  'russell', 'antonelli', 'leclerc', 'sainz'
) ON CONFLICT (user_id, event_id) DO NOTHING;
