-- Run this in the Supabase SQL editor AFTER schema.sql.
-- Adds: public read on study_notes (homepage gallery + anon cache reads),
-- and a per-client daily video-load quota table.

-- ── study_notes: open SELECT to everyone ────────────────────────────────────
-- Previously authenticated-only, which meant anonymous viewers could neither
-- read cached vocab (→ wasteful AI re-runs) nor would the planned public
-- homepage gallery be able to show it. Writes still go through server routes
-- using the service-role key, so opening reads is safe.
DROP POLICY IF EXISTS "study_notes_select" ON study_notes;
CREATE POLICY "study_notes_select" ON study_notes FOR SELECT USING (true);

-- ── daily_usage: per-client video-load quota ────────────────────────────────
-- client_key is "user:<auth uid>" for logged-in users, "anon:<cookie uuid>"
-- for anonymous ones. Both are capped at the same daily limit. Only loading a
-- *new* (not-yet-cached) video consumes quota; re-watching anything already in
-- `videos` is free.
CREATE TABLE IF NOT EXISTS daily_usage (
  client_key       TEXT   NOT NULL,
  usage_date       DATE   NOT NULL,
  video_count      INT    NOT NULL DEFAULT 0,
  loaded_video_ids TEXT[] NOT NULL DEFAULT '{}',
  PRIMARY KEY (client_key, usage_date)
);

-- RLS on, with NO policies: the table is reachable only via the service-role
-- key (used exclusively in trusted server routes), never from the browser.
ALTER TABLE daily_usage ENABLE ROW LEVEL SECURITY;

-- Atomically consume one quota unit for (client_key, date, video_id). Using a
-- row lock (FOR UPDATE) makes concurrent loads safe — without it, a read-then-
-- write race lets a client exceed the limit. Returns whether the load is
-- allowed and how many units remain. Loading the same video twice in a day is
-- idempotent (doesn't re-charge).
CREATE OR REPLACE FUNCTION consume_video_quota(
  p_client_key TEXT,
  p_video_id   TEXT,
  p_date       DATE,
  p_limit      INT
) RETURNS TABLE(allowed BOOLEAN, remaining INT) AS $$
DECLARE
  v_count INT;
  v_ids   TEXT[];
BEGIN
  INSERT INTO daily_usage (client_key, usage_date, video_count, loaded_video_ids)
  VALUES (p_client_key, p_date, 0, '{}')
  ON CONFLICT (client_key, usage_date) DO NOTHING;

  SELECT video_count, loaded_video_ids INTO v_count, v_ids
  FROM daily_usage
  WHERE client_key = p_client_key AND usage_date = p_date
  FOR UPDATE;

  -- Already counted today — allow without re-charging.
  IF p_video_id = ANY(v_ids) THEN
    RETURN QUERY SELECT TRUE, GREATEST(0, p_limit - v_count);
    RETURN;
  END IF;

  IF v_count >= p_limit THEN
    RETURN QUERY SELECT FALSE, 0;
    RETURN;
  END IF;

  UPDATE daily_usage
  SET video_count = video_count + 1,
      loaded_video_ids = array_append(loaded_video_ids, p_video_id)
  WHERE client_key = p_client_key AND usage_date = p_date;

  RETURN QUERY SELECT TRUE, p_limit - (v_count + 1);
END;
$$ LANGUAGE plpgsql;
