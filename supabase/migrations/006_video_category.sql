-- Run in the Supabase SQL editor (fresh query window) AFTER 005.
-- A video's content topic (single value, computed once on ingest from title +
-- transcript). Drives the homepage filter tags (All / Tech / Vlog / …).
-- Values come from the fixed taxonomy in src/lib/categories.ts.
ALTER TABLE videos ADD COLUMN IF NOT EXISTS category TEXT;
