-- Dormant 90-day unsuccessful-enquiry policy. No existing record is classified or backfilled.
-- Apply only to an approved environment; this file does not schedule or execute deletion.
ALTER TABLE enquiries ADD COLUMN unsuccessful_at TEXT
  CHECK (
    unsuccessful_at IS NULL OR (
      length(unsuccessful_at) = 24
      AND strftime('%Y-%m-%dT%H:%M:%fZ', unsuccessful_at) IS NOT NULL
      AND strftime('%Y-%m-%dT%H:%M:%fZ', unsuccessful_at) = unsuccessful_at
    )
  );

CREATE INDEX IF NOT EXISTS idx_enquiries_unsuccessful_at
  ON enquiries (unsuccessful_at, id)
  WHERE status = 'unsuccessful' AND unsuccessful_at IS NOT NULL;
