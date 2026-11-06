-- Newsletter subscribers. Create once with:
--   npx wrangler d1 execute noid --remote --file=db/schema.sql
CREATE TABLE IF NOT EXISTS subscribers (
  email      TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  country    TEXT,
  source     TEXT
);
