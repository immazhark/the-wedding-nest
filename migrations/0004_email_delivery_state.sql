-- Dormant consumer state. Apply to isolated staging only after separate approval.
-- Snapshot contains private notice text and is deleted with its outbox/enquiry.
ALTER TABLE outbox ADD COLUMN notice_json TEXT CHECK (notice_json IS NULL OR json_valid(notice_json));
ALTER TABLE outbox ADD COLUMN notice_version INTEGER;
ALTER TABLE outbox ADD COLUMN accepted_provider_id TEXT;
ALTER TABLE outbox ADD COLUMN held_reason TEXT CHECK (held_reason IS NULL OR held_reason IN ('invalid_event', 'provider', 'attempts_exhausted'));

-- Retrying an event must not alter its provider payload or idempotency identity.
CREATE TRIGGER outbox_freeze_email_notice BEFORE UPDATE ON outbox
WHEN OLD.notice_json IS NOT NULL AND (
  NEW.notice_json IS NOT OLD.notice_json OR NEW.notice_version IS NOT OLD.notice_version OR
  NEW.id IS NOT OLD.id OR NEW.enquiry_id IS NOT OLD.enquiry_id OR NEW.created_at IS NOT OLD.created_at
)
BEGIN
  SELECT RAISE(ABORT, 'Frozen email notice cannot be changed');
END;
