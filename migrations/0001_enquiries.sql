-- Enquiry intake (M2). Personal data lives only in payload_json; keep access least-privilege.
-- Retention/deletion policy must be agreed with the owner before live submission is enabled.
CREATE TABLE IF NOT EXISTS enquiries (
  id                TEXT PRIMARY KEY,
  idempotency_key   TEXT NOT NULL UNIQUE,
  created_at        TEXT NOT NULL,
  payload_json      TEXT NOT NULL,
  consent_at        TEXT NOT NULL,
  marketing_consent INTEGER NOT NULL DEFAULT 0 CHECK (marketing_consent IN (0, 1)),
  status            TEXT NOT NULL DEFAULT 'new'
);
CREATE INDEX IF NOT EXISTS idx_enquiries_created_at ON enquiries (created_at);

-- Transactional outbox: notifications are delivered asynchronously from here (later PR).
CREATE TABLE IF NOT EXISTS outbox (
  id            TEXT PRIMARY KEY,
  enquiry_id    TEXT NOT NULL UNIQUE REFERENCES enquiries (id) ON DELETE CASCADE,
  kind          TEXT NOT NULL,
  created_at    TEXT NOT NULL,
  attempts      INTEGER NOT NULL DEFAULT 0,
  delivered_at  TEXT
);
CREATE INDEX IF NOT EXISTS idx_outbox_pending ON outbox (delivered_at) WHERE delivered_at IS NULL;
