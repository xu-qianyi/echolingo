-- Run in the Supabase SQL editor (fresh query window) AFTER 004.
-- Per-user learner profile: native language + CEFR level. This is the cloud
-- copy of what anonymous users keep in localStorage; it only exists once a
-- user logs in, and is the source of truth across devices when present.
CREATE TABLE IF NOT EXISTS user_settings (
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  native_language TEXT NOT NULL DEFAULT 'zh',
  cefr_level      TEXT NOT NULL DEFAULT 'b1',
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Own row only.
CREATE POLICY "user_settings_all" ON user_settings
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
