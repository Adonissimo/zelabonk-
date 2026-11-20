CREATE TABLE IF NOT EXISTS schema_version (version INTEGER PRIMARY KEY);
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY, account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE IF NOT EXISTS profiles (
  account_id UUID PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  rupees INTEGER NOT NULL DEFAULT 0 CHECK (rupees >= 0 AND rupees <= 1000000000), runs INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0, total_kills BIGINT NOT NULL DEFAULT 0,
  progress JSONB NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS cloud_saves (
  account_id UUID PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  revision INTEGER NOT NULL CHECK (revision > 0), body JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS inventory (
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE, item_id TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity >= 0 AND quantity <= 1000000), PRIMARY KEY(account_id,item_id)
);
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY, host_id UUID NOT NULL REFERENCES accounts(id), invite_hash TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('lobby','running','won','lost','closed')),
  ranked BOOLEAN NOT NULL, mode TEXT NOT NULL, difficulty TEXT NOT NULL,
  ruleset TEXT NOT NULL, snapshot JSONB, revision INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS room_members (
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id), hero TEXT NOT NULL,
  PRIMARY KEY(room_id,account_id)
);
CREATE INDEX IF NOT EXISTS account_rooms ON room_members(account_id);
CREATE TABLE IF NOT EXISTS run_results (
  room_id UUID NOT NULL REFERENCES rooms(id), account_id UUID NOT NULL REFERENCES accounts(id),
  won BOOLEAN NOT NULL, kills INTEGER NOT NULL, duration_ms INTEGER NOT NULL,
  reward INTEGER NOT NULL, ranked BOOLEAN NOT NULL, ruleset TEXT NOT NULL,
  PRIMARY KEY(room_id,account_id), created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS clans (id UUID PRIMARY KEY, name TEXT NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS clan_members (
  clan_id UUID NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
  account_id UUID PRIMARY KEY REFERENCES accounts(id), role TEXT NOT NULL CHECK(role IN ('owner','member'))
);
CREATE TABLE IF NOT EXISTS clan_invites (
  token_hash TEXT PRIMARY KEY, clan_id UUID NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY, sender_id UUID NOT NULL REFERENCES accounts(id), receiver_id UUID NOT NULL REFERENCES accounts(id),
  revision INTEGER NOT NULL DEFAULT 1, status TEXT NOT NULL CHECK(status IN ('open','complete','cancelled')),
  sender_offer JSONB NOT NULL, receiver_offer JSONB NOT NULL DEFAULT '{}',
  sender_accepted BOOLEAN NOT NULL DEFAULT FALSE, receiver_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  CHECK(sender_id <> receiver_id)
);
CREATE TABLE IF NOT EXISTS operations (
  account_id UUID NOT NULL REFERENCES accounts(id), request_id TEXT NOT NULL, kind TEXT NOT NULL,
  fingerprint TEXT NOT NULL, result JSONB NOT NULL, PRIMARY KEY(account_id,request_id)
);
INSERT INTO schema_version(version) VALUES(1) ON CONFLICT DO NOTHING;
