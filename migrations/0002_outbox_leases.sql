-- Dormant notification-delivery groundwork. No dispatcher, recipient or schedule
-- is activated by this migration. Existing enquiry and outbox rows are retained.
-- Apply to staging separately before testing an opt-in consumer in that environment.
ALTER TABLE outbox ADD COLUMN claim_token TEXT;
ALTER TABLE outbox ADD COLUMN lease_until TEXT;
ALTER TABLE outbox ADD COLUMN next_attempt_at TEXT;

CREATE INDEX IF NOT EXISTS idx_outbox_claimable
  ON outbox (created_at, id)
  WHERE delivered_at IS NULL;
