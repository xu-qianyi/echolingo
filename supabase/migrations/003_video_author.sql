-- Run this in the Supabase SQL editor (a fresh query window) AFTER 002.
-- Adds the YouTube channel/author name so the homepage gallery can show it.
ALTER TABLE videos ADD COLUMN IF NOT EXISTS author_name TEXT;
