# Operator audit and log lifecycle

## Implemented data boundaries

`operator_audit` (migration 0005) stores the authenticated operator email, enquiry identifier, action time and status transition. These are linkable personal identifiers, not anonymous data. Its purpose is restricted operational accountability: identify who changed a record and investigate stale or disputed actions. Status and audit writes remain a single transaction; a failed audit insert rolls back the status change.

The authenticated held-notification review returns bounded event metadata only; event references are linkable identifiers, not anonymous data. It omits enquiry identifiers, notice contents, recipient/provider identifiers and claim tokens. No held event is changed by reviewing or paging.

The authenticated, allowlisted operator detail API returns at most the latest 20 entries for an enquiry. This limit is a display limit, not a retention period. Database and provider-log access must remain limited to authorised operators/administrators; do not copy audit rows into public issues, analytics or screenshots.

Enquiry deletion cascades to associated outbox snapshots. Audit rows deliberately have no enquiry foreign key and survive enquiry deletion, retaining the operator email and enquiry ID. No audit cleanup job or approved audit retention duration is implemented. Do not promise that enquiry deletion removes every linked identifier.

Application status logs now contain only event/action, target status and outcome; the enquiry ID and operator email are omitted. Earlier deployed versions logged enquiry IDs, which remain linkable where retained. This change does not erase existing logs. Provider request telemetry can also include request URLs containing enquiry IDs; removing an application log field does not establish anonymous provider logs.

`wrangler.jsonc` enables observability, but does not establish the provider account's log retention, access configuration or export destinations. Read these settings back before live intake and record their actual retention and authorised access. No provider configuration or existing log deletion is performed by this source change.

## Policy recommendation — not approved or activated

A concrete proposal for owner review is to retain audit rows for 180 days after the action and operational logs for no more than 30 days, with any justified investigation hold documented separately with a purpose, responsible reviewer and review date. These proposed durations do not change the approved enquiry clock and are not a statement of current provider retention or legal requirements.

Before activation, approve the audit/log durations and hold procedure, reconcile booked-client and pending-delivery policy, verify provider log retention/access, and implement separately reviewed bounded cleanup with impact counts and failure visibility. Until then, audit cleanup and live retention execution remain gated.

Unsuccessful enquiries become eligible 90 days after explicit unsuccessful disposition. The dormant deletion primitive rechecks the status, canonical clock and pending-delivery exclusion in the DELETE itself. Active/booked records are protected. Eligibility is neither a deletion schedule nor proof of deletion; no automatic cleanup route or cron is installed.
