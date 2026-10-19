-- Sport Sal Rei Club: content database (Cloudflare D1)

CREATE TABLE teams (
  id      TEXT PRIMARY KEY,          -- 'sal-rei'
  name    TEXT NOT NULL,             -- 'Sal Rei'
  short   TEXT NOT NULL,             -- 'SSRC', shown in the round crest
  is_us   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE competitions (
  id         TEXT PRIMARY KEY,       -- 'liga-kabrer-2026-27'
  season     TEXT NOT NULL,          -- '2026/27'
  name_en    TEXT NOT NULL,
  name_pt    TEXT NOT NULL,
  kind       TEXT NOT NULL DEFAULT 'league',   -- 'league' (table) | 'cup' (single matches)
  sort       INTEGER NOT NULL DEFAULT 0,
  archived   INTEGER NOT NULL DEFAULT 0,       -- 1 = past season, hidden from the site
  final_table TEXT                              -- JSON snapshot for archived seasons without full results
);

CREATE TABLE matches (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  competition_id TEXT NOT NULL REFERENCES competitions(id),
  round          INTEGER,                       -- matchday number (league)
  date           TEXT NOT NULL,                 -- 'YYYY-MM-DD'
  time           TEXT,                          -- 'HH:MM' or NULL when not announced
  venue          TEXT,
  home_id        TEXT NOT NULL REFERENCES teams(id),
  away_id        TEXT NOT NULL REFERENCES teams(id),
  home_score     INTEGER,
  away_score     INTEGER,
  status         TEXT NOT NULL DEFAULT 'scheduled'  -- 'scheduled' | 'played' | 'postponed'
);
CREATE INDEX matches_comp ON matches(competition_id, date);
CREATE INDEX matches_date ON matches(date);

-- Manual order for teams still level after every tie-break (drawing of lots, play-off).
CREATE TABLE tie_order (
  competition_id TEXT NOT NULL,
  team_id        TEXT NOT NULL,
  priority       INTEGER NOT NULL,              -- lower ranks higher
  PRIMARY KEY (competition_id, team_id)
);

CREATE TABLE news (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT NOT NULL UNIQUE,
  status      TEXT NOT NULL DEFAULT 'draft',    -- 'draft' | 'published'
  date        TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'club',
  read_min    INTEGER NOT NULL DEFAULT 3,
  image       TEXT,                              -- '/assets/img/...' or '/media/...'
  image_pos   TEXT,                              -- CSS object-position
  gfx_big     TEXT,                              -- big figure shown when there is no image
  gfx_cap_en  TEXT, gfx_cap_pt TEXT,
  title_en    TEXT, title_pt TEXT,
  excerpt_en  TEXT, excerpt_pt TEXT,
  body_en     TEXT, body_pt TEXT,                -- HTML: p.lead, p, h2, ul
  pull_en     TEXT, pull_pt TEXT,                -- side quote
  facts_en    TEXT, facts_pt TEXT,               -- JSON [[label, value], ...]
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX news_pub ON news(status, date);

CREATE TABLE partners (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  tier          TEXT NOT NULL DEFAULT 'official', -- 'main' | 'technical' | 'official'
  logo          TEXT,                             -- image URL; NULL = wordmark
  logo_class    TEXT,                             -- size class in the partners strip
  wordmark_html TEXT,                             -- styled text logo (seeded partners only)
  url           TEXT,
  sort          INTEGER NOT NULL DEFAULT 0,
  in_strip      INTEGER NOT NULL DEFAULT 1,       -- shown in the partners strip
  active        INTEGER NOT NULL DEFAULT 1
);

-- Where a partner is credited around the site ('matchday', 'main_band', 'newsroom', ...)
CREATE TABLE placements (
  slot       TEXT PRIMARY KEY,
  partner_id INTEGER REFERENCES partners(id)
);
