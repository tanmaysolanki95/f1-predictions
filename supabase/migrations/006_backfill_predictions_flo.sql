-- Backfill predictions for Flo (fa5d1ac6-b3e2-4bdd-88c6-db8aa47c0384)

-- Week 1 (Australian GP, event_id=1, no sprint)
INSERT INTO predictions (
  user_id, event_id,
  race_pole_driver_id,
  race_p1_driver_id, race_p2_driver_id, race_p3_driver_id, race_p10_driver_id
) VALUES (
  'fa5d1ac6-b3e2-4bdd-88c6-db8aa47c0384', 1,
  'max_verstappen',
  'max_verstappen', 'hamilton', 'russell', 'hadjar'
) ON CONFLICT (user_id, event_id) DO NOTHING;

-- Week 2 (Chinese GP, event_id=2, sprint weekend)
INSERT INTO predictions (
  user_id, event_id,
  sprint_pole_driver_id, sprint_p1_driver_id,
  race_pole_driver_id,
  race_p1_driver_id, race_p2_driver_id, race_p3_driver_id, race_p10_driver_id
) VALUES (
  'fa5d1ac6-b3e2-4bdd-88c6-db8aa47c0384', 2,
  'antonelli', 'russell',
  'russell',
  'russell', 'leclerc', 'hamilton', 'arvid_lindblad'
) ON CONFLICT (user_id, event_id) DO NOTHING;
