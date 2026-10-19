-- Admin accounts, sessions and login throttling.

CREATE TABLE admin_users (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  email       TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name        TEXT NOT NULL,
  pass_hash   TEXT NOT NULL,             -- PBKDF2-SHA256, hex
  pass_salt   TEXT NOT NULL,             -- hex
  is_owner    INTEGER NOT NULL DEFAULT 0, -- owners can manage accounts
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE admin_sessions (
  token_hash  TEXT PRIMARY KEY,          -- SHA-256 of the cookie value
  user_id     INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  expires_at  TEXT NOT NULL
);

CREATE TABLE login_attempts (
  ip          TEXT NOT NULL,
  at          TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX login_attempts_ip ON login_attempts(ip, at);

-- Images uploaded from the admin (files live in the R2 bucket).
CREATE TABLE media (
  key         TEXT PRIMARY KEY,          -- 'news/2026/10/ab12cd.jpg'
  type        TEXT NOT NULL,
  size        INTEGER NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
