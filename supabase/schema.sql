-- Run this in the Supabase SQL editor to set up EchoLingo's schema.

-- Videos (shared cache, populated when any user loads a video)
CREATE TABLE IF NOT EXISTS videos (
  id          UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  youtube_id  TEXT    NOT NULL UNIQUE,
  title       TEXT,
  thumbnail_url TEXT,
  duration    INTEGER, -- seconds
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- User video history
CREATE TABLE IF NOT EXISTS user_videos (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  video_id      UUID REFERENCES videos(id)     ON DELETE CASCADE NOT NULL,
  cefr_level    TEXT NOT NULL DEFAULT 'b1',
  last_watched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);

-- AI study notes (cached by video + level, shared across users)
CREATE TABLE IF NOT EXISTS study_notes (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id    UUID REFERENCES videos(id) ON DELETE CASCADE NOT NULL,
  cefr_level  TEXT NOT NULL,
  content     JSONB NOT NULL, -- { key_vocabulary: [...], key_expressions: [...] }
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(video_id, cefr_level)
);

-- User saved items (words / phrases / sentences)
CREATE TABLE IF NOT EXISTS saved_items (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  video_id      UUID REFERENCES videos(id)     ON DELETE CASCADE NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('word', 'phrase', 'sentence')),
  content       TEXT NOT NULL,
  definition    TEXT,
  example       TEXT,
  zh_definition TEXT,
  zh_example    TEXT,
  timestamp_ms  INTEGER, -- position in video (ms)
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Row Level Security ──────────────────────────────────────────────────────

ALTER TABLE videos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_items ENABLE ROW LEVEL SECURITY;

-- Videos: public read; authenticated users can upsert (needed when saving words)
CREATE POLICY "videos_select" ON videos FOR SELECT USING (true);
CREATE POLICY "videos_insert" ON videos FOR INSERT TO authenticated WITH CHECK (true);

-- User videos: own rows only
CREATE POLICY "user_videos_all" ON user_videos
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Study notes: any authenticated user can read and upsert (vocab data is not user-specific)
CREATE POLICY "study_notes_select" ON study_notes
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "study_notes_insert" ON study_notes
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "study_notes_update" ON study_notes
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Saved items: own rows only
CREATE POLICY "saved_items_all" ON saved_items
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Shared AI caches (token savings) ────────────────────────────────────────
-- Both are non-user-specific, level-independent caches. They deliberately have
-- NO foreign key to `videos`, so they populate even for anonymous (lazy-auth)
-- viewers — which is where most of the token savings come from.

-- Sentence translations, keyed by content hash. Reusable across videos, users,
-- and CEFR levels (a sentence's Chinese translation doesn't depend on level).
CREATE TABLE IF NOT EXISTS segment_translations (
  text_hash   TEXT PRIMARY KEY,        -- sha256(source_text)
  source_text TEXT NOT NULL,
  zh          TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Word / phrase definitions, keyed by lowercased term. Survives serverless cold
-- starts and is shared across all users (the in-process cache resets per instance).
CREATE TABLE IF NOT EXISTS definitions (
  word          TEXT PRIMARY KEY,
  pos           TEXT,
  zh_definition TEXT,
  example       TEXT,
  zh_example    TEXT,
  phonetic      TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE segment_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE definitions          ENABLE ROW LEVEL SECURITY;

-- Public read + insert (no TO clause → applies to anon AND authenticated).
-- This is what lets the cache fill for non-logged-in users. Insert-only writes
-- (upsert uses ON CONFLICT DO NOTHING), so no UPDATE policy is needed.
CREATE POLICY "segment_translations_select" ON segment_translations FOR SELECT USING (true);
CREATE POLICY "segment_translations_insert" ON segment_translations FOR INSERT WITH CHECK (true);
CREATE POLICY "definitions_select" ON definitions FOR SELECT USING (true);
CREATE POLICY "definitions_insert" ON definitions FOR INSERT WITH CHECK (true);
