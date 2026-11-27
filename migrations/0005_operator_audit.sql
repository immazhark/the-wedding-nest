-- Restricted operator action trail: login email and enquiry id are linkable personal identifiers.
-- No customer payload is copied here. Retention policy: docs/privacy-retention.md.
-- enquiry_id deliberately has no foreign key so the trail survives retention deletion.
CREATE TABLE IF NOT EXISTS operator_audit (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  at          TEXT NOT NULL,
  operator    TEXT NOT NULL,
  enquiry_id  TEXT NOT NULL,
  from_status TEXT NOT NULL,
  to_status   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_operator_audit_enquiry ON operator_audit (enquiry_id, id);
