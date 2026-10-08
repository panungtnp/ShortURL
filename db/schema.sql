-- Short URL system — PostgreSQL schema
-- Run: psql "$DATABASE_URL" -f db/schema.sql

CREATE TABLE IF NOT EXISTS links (
  id         SERIAL PRIMARY KEY,
  code       TEXT UNIQUE NOT NULL,
  long_url   TEXT NOT NULL,
  is_alias   BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clicks (
  id         SERIAL PRIMARY KEY,
  link_id    INT NOT NULL REFERENCES links (id) ON DELETE CASCADE,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip         TEXT NULL,
  user_agent TEXT NULL,
  referrer   TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_links_code ON links (code);
CREATE INDEX IF NOT EXISTS idx_clicks_link_time ON clicks (link_id, clicked_at DESC);
