-- Run in the Supabase SQL editor (fresh query window) AFTER 003.
-- A video's *intrinsic* difficulty (single value, computed once from the
-- transcript). This is distinct from study_notes.cefr_level, which is the
-- viewing learner's level. Used for the gallery label + level filtering.
ALTER TABLE videos ADD COLUMN IF NOT EXISTS cefr_level TEXT;
