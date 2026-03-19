-- ============================================================
-- TIGHTEN ROLE GRANTS — defense-in-depth for anon/authenticated
-- ============================================================
-- Supabase defaults grant all privileges (INSERT, UPDATE, DELETE,
-- TRUNCATE) to anon and authenticated on every table, relying
-- solely on RLS for access control. This adds a second layer by
-- revoking write grants that should never be needed, so even if
-- RLS were accidentally disabled, these roles still cannot write.

-- anon (unauthenticated API access): read-only across the board
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA public FROM anon;

-- authenticated: revoke write access on admin-only tables
-- (only written by the scoring script via service_role)
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON
  drivers, events, seasons, session_results, scores, allowed_signup_emails
FROM authenticated;

-- authenticated + predictions: keep INSERT + UPDATE (RLS scopes
-- to own rows on unlocked events); revoke DELETE + TRUNCATE
REVOKE DELETE, TRUNCATE ON predictions FROM authenticated;

-- authenticated + profiles: keep UPDATE only (RLS scopes to own
-- row); INSERT handled by SECURITY DEFINER trigger on signup
REVOKE INSERT, DELETE, TRUNCATE ON profiles FROM authenticated;

-- leaderboard is a read-only view — revoke stale write grants
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON leaderboard FROM authenticated;
