-- Migration: Create processed_blog_posts table for tracking processed blog URLs
-- Purpose: Store URLs and metadata of blog posts already processed by the cron function
-- to prevent duplicate processing

CREATE TABLE IF NOT EXISTS processed_blog_posts (
  url TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on processed_at for efficient time-based queries
CREATE INDEX IF NOT EXISTS idx_processed_blog_posts_processed_at
  ON processed_blog_posts(processed_at DESC);

-- Enable RLS if you need row-level security in the future
ALTER TABLE processed_blog_posts ENABLE ROW LEVEL SECURITY;

-- Allow service role full access for the cron function
CREATE POLICY "Allow service role full access" ON processed_blog_posts
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
